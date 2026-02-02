import React, { useState } from "react";
import { X, Briefcase, User, Users, Target, Layers } from "lucide-react";
import { toast } from "react-hot-toast";
import CustomSelect from "../../../../components/common/CustomSelect";
import { createProject, updateProject } from "../../services/manageService";
import { useDeviceInfo } from "../../../../hooks/useDeviceInfo";
import { UserDropdowns } from "../../../../hooks/useUserDropdowns";

import type { ProjectType } from "../../types";

interface ProjectFormModalProps {
  project?: ProjectType | undefined;
  onClose: () => void;
  onSuccess: () => void;
  dropdowns: UserDropdowns;
}

interface FormData {
  name: string;
  ownerId: string;
  apmId: string;
  qaId: string;
  monthlyTarget: string;
}

const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  project,
  onClose,
  onSuccess,
  dropdowns,
}) => {
  const isEditMode = !!project;
  const { device_id, device_type } = useDeviceInfo();

  const [formData, setFormData] = useState<FormData>({
    name: project?.project_name || "",
    ownerId: project?.owner_id?.toString() || "",
    apmId: project?.apm_id?.toString() || "",
    qaId: project?.qa_id?.toString() || "",
    monthlyTarget: project?.monthly_hours_target?.toString() || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );

  const validate = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = "Project name is required";
    if (!formData.ownerId) newErrors.ownerId = "Owner is required";
    if (!formData.apmId) newErrors.apmId = "Assistant Manager is required";
    if (!formData.qaId) newErrors.qaId = "QA Owner is required";
    if (!formData.monthlyTarget || isNaN(Number(formData.monthlyTarget)))
      newErrors.monthlyTarget =
        "Monthly target is required and must be a number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setIsSubmitting(true);
      const payload = {
        project_name: formData.name,
        owner_id: formData.ownerId,
        apm_id: formData.apmId,
        qa_id: formData.qaId,
        monthly_hours_target: Number(formData.monthlyTarget),
        device_id,
        device_type,
      };
      if (isEditMode) {
        await updateProject(project?.project_id, payload);
        toast.success("Project updated successfully");
      } else {
        await createProject(payload);
        toast.success("Project created successfully");
      }
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-100 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-indigo-600 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              {isEditMode ? "Edit Project" : "Create New Project"}
            </h2>
            <p className="text-indigo-100 text-xs mt-0.5">
              {isEditMode
                ? `Updating ${project?.project_name}`
                : "Fill in the information to create a new project"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <form id="project-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" /> Project Details
              </h3>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ml-1">
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. HRMS Redesign"
                  className={`w-full pr-4 py-2.5 bg-slate-50 border ${errors.name ? "border-rose-400" : "border-slate-200"} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all`}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                {errors.name && (
                  <p className="text-[10px] text-rose-500 font-bold ml-1">
                    {errors.name}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">
                    Owner
                  </label>
                  <CustomSelect
                    value={formData.ownerId}
                    onChange={(val: string) =>
                      setFormData({ ...formData, ownerId: val })
                    }
                    options={dropdowns.projectManagers.map((m) => ({
                      value: (m.user_id || m.id)?.toString() || "",
                      label:
                        typeof m.label === "string"
                          ? m.label
                          : String(m.label ?? ""),
                    }))}
                    placeholder="Select Owner"
                    className={errors.ownerId ? "border-rose-400" : ""}
                  />
                  {errors.ownerId && (
                    <p className="text-[10px] text-rose-500 font-bold ml-1">
                      {errors.ownerId}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">
                    Assistant Manager
                  </label>
                  <CustomSelect
                    value={formData.apmId}
                    onChange={(val: string) =>
                      setFormData({ ...formData, apmId: val })
                    }
                    options={dropdowns.assistantManagers.map((m) => ({
                      value: (m.user_id || m.id)?.toString() || "",
                      label:
                        typeof m.label === "string"
                          ? m.label
                          : String(m.label ?? ""),
                    }))}
                    placeholder="Select AM"
                    className={errors.apmId ? "border-rose-400" : ""}
                  />
                  {errors.apmId && (
                    <p className="text-[10px] text-rose-500 font-bold ml-1">
                      {errors.apmId}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ml-1">
                  QA Owner
                </label>
                <CustomSelect
                  value={formData.qaId}
                  onChange={(val: string) =>
                    setFormData({ ...formData, qaId: val })
                  }
                  options={dropdowns.qas.map((q) => ({
                    value: (q.user_id || q.id)?.toString() || "",
                    label:
                      typeof q.label === "string"
                        ? q.label
                        : String(q.label ?? ""),
                  }))}
                  placeholder="Select QA"
                  className={errors.qaId ? "border-rose-400" : ""}
                />
                {errors.qaId && (
                  <p className="text-[10px] text-rose-500 font-bold ml-1">
                    {errors.qaId}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ml-1">
                  Monthly Hours Target
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 160"
                  className={`w-full pr-4 py-2.5 bg-slate-50 border ${errors.monthlyTarget ? "border-rose-400" : "border-slate-200"} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all`}
                  value={formData.monthlyTarget}
                  onChange={(e) =>
                    setFormData({ ...formData, monthlyTarget: e.target.value })
                  }
                />
                {errors.monthlyTarget && (
                  <p className="text-[10px] text-rose-500 font-bold ml-1">
                    {errors.monthlyTarget}
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>
        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="project-form"
            disabled={isSubmitting}
            className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:scale-95 flex items-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {isEditMode ? "Update Project" : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectFormModal;
