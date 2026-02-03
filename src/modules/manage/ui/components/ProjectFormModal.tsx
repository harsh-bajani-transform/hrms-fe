import React, { useState } from "react";
import { Briefcase, Layers, X, Target, Users, Shield } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-white">
        {/* Banner Header */}
        <div className="bg-linear-to-r from-blue-600 to-blue-700 px-8 py-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/20 rounded-full -ml-12 -mb-12 blur-xl" />

          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-inner">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-white leading-none">
                {isEditMode ? "Edit Project" : "New Project"}
              </DialogTitle>
              <p className="text-blue-100/80 text-sm font-medium mt-1.5">
                {isEditMode
                  ? `Optimizing ${project?.project_name}`
                  : "Launch a new operational initiative"}
              </p>
            </div>
          </div>

        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-8 bg-white max-h-[70vh] overflow-y-auto scrollbar-hide"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* PROJECT NAME */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-gray-700 px-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Project Title
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. HRMS Migration"
                className={`h-11 bg-gray-50 border-gray-200 focus:bg-white transition-all ${errors.name ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
              />
              {errors.name && (
                <p className="text-xs text-red-500 font-medium mt-1 px-1">
                  {errors.name}
                </p>
              )}
            </div>

            {/* OWNER */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 px-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Project Owner (PM)
              </label>
              <Select
                value={formData.ownerId}
                onValueChange={(val) =>
                  setFormData({ ...formData, ownerId: val })
                }
              >
                <SelectTrigger
                  className={`h-11 w-full bg-gray-50 border-gray-200 focus:bg-white transition-all ${errors.ownerId ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
                >
                  <SelectValue placeholder="Select PM" />
                </SelectTrigger>
                <SelectContent>
                  {dropdowns.projectManagers.map((m) => (
                    <SelectItem
                      key={(m.user_id || m.id)?.toString()}
                      value={(m.user_id || m.id)?.toString() || ""}
                    >
                      {typeof m.label === "string"
                        ? m.label
                        : String(m.label ?? "")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ASSISTANT MANAGER */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 px-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Assistant Manager
              </label>
              <Select
                value={formData.apmId}
                onValueChange={(val) =>
                  setFormData({ ...formData, apmId: val })
                }
              >
                <SelectTrigger
                  className={`h-11 w-full bg-gray-50 border-gray-200 focus:bg-white transition-all ${errors.apmId ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
                >
                  <SelectValue placeholder="Select AM" />
                </SelectTrigger>
                <SelectContent>
                  {dropdowns.assistantManagers.map((m) => (
                    <SelectItem
                      key={(m.user_id || m.id)?.toString()}
                      value={(m.user_id || m.id)?.toString() || ""}
                    >
                      {typeof m.label === "string"
                        ? m.label
                        : String(m.label ?? "")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* QA OWNER */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 px-1 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                Quality Assurance
              </label>
              <Select
                value={formData.qaId}
                onValueChange={(val) => setFormData({ ...formData, qaId: val })}
              >
                <SelectTrigger
                  className={`h-11 w-full bg-gray-50 border-gray-200 focus:bg-white transition-all ${errors.qaId ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
                >
                  <SelectValue placeholder="Select QA" />
                </SelectTrigger>
                <SelectContent>
                  {dropdowns.qas.map((q) => (
                    <SelectItem
                      key={(q.user_id || q.id)?.toString()}
                      value={(q.user_id || q.id)?.toString() || ""}
                    >
                      {typeof q.label === "string"
                        ? q.label
                        : String(q.label ?? "")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* MONTHLY TARGET */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 px-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                Monthly Hours Target
              </label>
              <Input
                name="monthlyTarget"
                type="number"
                min="0"
                step="1"
                value={formData.monthlyTarget}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyTarget: e.target.value })
                }
                placeholder="e.g. 160"
                className={`h-11 bg-gray-50 border-gray-200 focus:bg-white transition-all ${errors.monthlyTarget ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 flex-row gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 h-12 font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 rounded-xl transition-all border-none"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectFormModal;
