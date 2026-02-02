import React, { useState, useRef } from "react";
import {
  Upload,
  ClipboardList,
  Calendar,
  Users,
  FileText,
  X,
  PlusCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
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
import { fileToBase64 } from "../../../../lib/fileToBase64";
import { addTask, updateTask } from "../../services/manageService";
import { useDeviceInfo } from "../../../../hooks/useDeviceInfo";

import type { TaskType } from "../../types";

interface TaskFormModalProps {
  task?: TaskType | undefined;
  onClose: () => void;
  onSuccess: () => void;
  dropdowns: {
    users: Array<{
      user_id?: string | number;
      id?: string | number;
      label: string;
    }>;
    projects: Array<{
      project_id?: string | number;
      id?: string | number;
      label: string;
    }>;
  };
}

interface FormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  assignedTo: string;
  projectId: string;
  attachment: string | null;
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({
  task,
  onClose,
  onSuccess,
  dropdowns,
}) => {
  const isEditMode = !!task;
  const { device_id, device_type } = useDeviceInfo();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    name: task?.task_name || "",
    description: task?.task_description || "",
    startDate: task?.start_date || "",
    endDate: task?.end_date || "",
    assignedTo: task?.assigned_to?.toString() || "",
    projectId: task?.project_id?.toString() || "",
    attachment: null,
  });

  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(
    task?.attachment || null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );

  const validate = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = "Task name is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (!formData.assignedTo) newErrors.assignedTo = "Assignee is required";
    if (!formData.projectId) newErrors.projectId = "Project is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setIsSubmitting(true);
      const payload = {
        task_name: formData.name,
        task_description: formData.description,
        start_date: formData.startDate,
        end_date: formData.endDate,
        assigned_to: formData.assignedTo,
        project_id: formData.projectId,
        attachment: formData.attachment,
        device_id,
        device_type,
      };
      if (isEditMode) {
        await updateTask({ ...payload, task_id: task?.task_id });
        toast.success("Task updated successfully");
      } else {
        await addTask(payload);
        toast.success("Task created successfully");
      }
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Attachment size must be less than 5MB");
        return;
      }
      const base64 = await fileToBase64(file);
      setFormData({ ...formData, attachment: base64 as string });
      setAttachmentPreview(file.name);
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
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-white leading-none">
                {isEditMode ? "Update Task" : "New Task Assignment"}
              </DialogTitle>
              <p className="text-blue-100/80 text-sm font-medium mt-1.5">
                {isEditMode
                  ? `Refining ${task?.task_name}`
                  : "Organize effort and track progress"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-8 bg-white max-h-[70vh] overflow-y-auto scrollbar-hide"
        >
          {/* Attachment Area */}
          <div className="flex flex-col items-center justify-center space-y-4 mb-4">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 group-hover:border-blue-400 overflow-hidden flex items-center justify-center transition-all">
                {attachmentPreview ? (
                  <div className="flex flex-col items-center gap-1">
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-400 group-hover:text-blue-500">
                    <Upload className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity">
                <PlusCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-slate-400 font-medium italic">
              {attachmentPreview
                ? attachmentPreview
                : "Attach brief/reference (Max 5MB)"}
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="application/pdf,image/*"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* TASK NAME */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <ClipboardList className="w-3 h-3" />
                Task Title
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. Data Analysis"
                className={`h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all ${errors.name ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
              />
            </div>

            {/* PROJECT */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                Project
              </label>
              <Select
                value={formData.projectId}
                onValueChange={(val) =>
                  setFormData({ ...formData, projectId: val })
                }
              >
                <SelectTrigger
                  className={`h-11 w-full bg-slate-50/50 border-slate-200 focus:bg-white transition-all ${errors.projectId ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
                >
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {dropdowns.projects.map((p) => (
                    <SelectItem
                      key={(p.project_id || p.id)?.toString()}
                      value={(p.project_id || p.id)?.toString() || ""}
                    >
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ASSIGN TO */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <Users className="w-3 h-3" />
                Assignee
              </label>
              <Select
                value={formData.assignedTo}
                onValueChange={(val) =>
                  setFormData({ ...formData, assignedTo: val })
                }
              >
                <SelectTrigger
                  className={`h-11 w-full bg-slate-50/50 border-slate-200 focus:bg-white transition-all ${errors.assignedTo ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
                >
                  <SelectValue placeholder="Select User" />
                </SelectTrigger>
                <SelectContent>
                  {dropdowns.users.map((u) => (
                    <SelectItem
                      key={(u.user_id || u.id)?.toString()}
                      value={(u.user_id || u.id)?.toString() || ""}
                    >
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* START DATE */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                Start Date
              </label>
              <Input
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className={`h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all ${errors.startDate ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
              />
            </div>

            {/* END DATE */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                End Date
              </label>
              <Input
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className={`h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all ${errors.endDate ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
              />
            </div>

            {/* DESCRIPTION */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                Task Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                placeholder="Detail the expectations..."
                className="w-full p-4 text-sm rounded-xl bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-blue-400 focus:ring-blue-100 transition-all outline-hidden resize-none"
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
                "Assign Task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskFormModal;
