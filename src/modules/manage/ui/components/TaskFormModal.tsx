import React, { useState, useRef } from "react";
import {
  Upload,
  ClipboardList,
  Calendar,
  Users,
  FileText,
  X,
  PlusCircle,
  Hash,
  ChevronDown,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
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
import { fileToBase64 } from "../../../../lib/fileToBase64";
import { addTask, updateTask } from "../../services/manageService";
import { useDeviceInfo } from "../../../../hooks/useDeviceInfo";

import type { TaskFormModalProps } from "../../types";

interface FormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  assignedTo: string;
  projectId: string;
  attachment: string | null;
  target: string;
  teamIds: (string | number)[];
  importantColumns: string[];
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
    target: task?.task_target?.toString() || "",
    teamIds: task?.task_team_id
      ? Array.isArray(task.task_team_id)
        ? task.task_team_id.map((id) => id.toString())
        : [task.task_team_id.toString()]
      : [],
    importantColumns: task?.important_columns || [],
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
    if (!formData.projectId) newErrors.projectId = "Project is required";
    if (!formData.target || isNaN(Number(formData.target)))
      newErrors.target = "Target is required and must be a number";
    if (formData.teamIds.length === 0)
      newErrors.teamIds = "At least one agent must be assigned";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setIsSubmitting(true);
      
      const submitData = new FormData();
      submitData.append("project_id", formData.projectId);
      submitData.append("task_name", formData.name);
      submitData.append("task_description", formData.description);
      submitData.append("task_target", formData.target);
      submitData.append("device_id", device_id);
      submitData.append("device_type", device_type);
      
      // Legacy backend formats for arrays (JSON strings of numbers)
      submitData.append("task_team_id", JSON.stringify(formData.teamIds.map(Number)));
      
      if (formData.importantColumns.length > 0) {
        submitData.append("important_columns", JSON.stringify(formData.importantColumns));
      }

      // Legacy backend expects 'task_file'
      if (fileInputRef.current?.files?.[0]) {
        submitData.append("task_file", fileInputRef.current.files[0]);
      }

      if (isEditMode) {
        submitData.append("task_id", String(task?.task_id));
        await updateTask(submitData);
        toast.success("Task updated successfully");
      } else {
        await addTask(submitData);
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
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded flex items-center justify-center border border-white/30 shadow-inner">
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
              <div className="w-20 h-20 rounded bg-slate-50 border-2 border-dashed border-slate-200 group-hover:border-blue-400 overflow-hidden flex items-center justify-center transition-all">
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
              <label className="text-sm font-medium text-gray-700 px-1 flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" />
                Task Title
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. Data Analysis"
                className={` bg-gray-50 border-gray-200 focus:bg-white transition-all ${errors.name ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
              />
            </div>

            {/* PROJECT */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 px-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Project
              </label>
              <Select
                value={formData.projectId}
                onValueChange={(val) =>
                  setFormData({ ...formData, projectId: val })
                }
              >
                <SelectTrigger
                  className={` w-full bg-gray-50 border-gray-200 focus:bg-white transition-all ${errors.projectId ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
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
              <label className="text-sm font-medium text-gray-700 px-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Assignee
              </label>
              <Select
                value={formData.assignedTo}
                onValueChange={(val) =>
                  setFormData({ ...formData, assignedTo: val })
                }
              >
                <SelectTrigger
                  className={` w-full bg-gray-50 border-gray-200 focus:bg-white transition-all ${errors.assignedTo ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
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
              <label className="text-sm font-medium text-gray-700 px-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Start Date
              </label>
              <Input
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className={` bg-gray-50 border-gray-200 focus:bg-white transition-all ${errors.startDate ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
              />
            </div>

            {/* END DATE */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 px-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                End Date
              </label>
              <Input
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className={` bg-gray-50 border-gray-200 focus:bg-white transition-all ${errors.endDate ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
              />
            </div>

            {/* DESCRIPTION */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-gray-700 px-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
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
                className="w-full p-4 text-sm rounded bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-400 focus:ring-blue-100 transition-all outline-hidden resize-none"
              />
            </div>

            {/* TARGET (HOURS) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 px-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" />
                Target (Hrs)
              </label>
              <Input
                name="target"
                type="number"
                value={formData.target}
                onChange={(e) =>
                  setFormData({ ...formData, target: e.target.value })
                }
                placeholder="e.g. 10"
                className={` bg-gray-50 border-gray-200 focus:bg-white transition-all ${errors.target ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
              />
              {errors.target && (
                <p className="text-xs text-red-500 font-medium mt-1 px-1">
                  {errors.target}
                </p>
              )}
            </div>

            {/* TEAM ASSIGNMENT (AGENTS) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 px-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Select Agent(s)
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={` w-full bg-gray-50 border-gray-200 flex justify-between px-3 font-normal font-sans ${errors.teamIds ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
                  >
                    <span className="truncate">
                      {formData.teamIds.length > 0
                        ? `${formData.teamIds.length} selected`
                        : "Select Agents"}
                    </span>
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 max-h-[300px] overflow-y-auto">
                  {dropdowns.users.map((u) => {
                    const id = (u.user_id || u.id)?.toString() || "";
                    return (
                      <DropdownMenuCheckboxItem
                        key={id}
                        checked={formData.teamIds.includes(id)}
                        onCheckedChange={(checked) => {
                          const nextIds = checked
                            ? [...formData.teamIds, id]
                            : formData.teamIds.filter((x) => x !== id);
                          setFormData({ ...formData, teamIds: nextIds });
                        }}
                      >
                        {u.label}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              {formData.teamIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.teamIds.map((id) => {
                    const agent = dropdowns.users.find(
                      (a) => (a.user_id || a.id)?.toString() === id.toString(),
                    );
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-0.5 border-none"
                      >
                        {agent?.label || id}
                        <X
                          className="w-3 h-3 ml-1 cursor-pointer"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              teamIds: formData.teamIds.filter((x) => x !== id),
                            });
                          }}
                        />
                      </Badge>
                    );
                  })}
                </div>
              )}
              {errors.teamIds && (
                <p className="text-xs text-red-500 font-medium mt-1 px-1">
                  {errors.teamIds}
                </p>
              )}
            </div>

            {/* IMPORTANT COLUMNS */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <ClipboardList className="w-4 h-4 text-blue-600" />
                  Important Columns
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      importantColumns: [...formData.importantColumns, ""],
                    })
                  }
                  className="h-7 text-[10px] font-bold text-blue-600 uppercase tracking-wider hover:bg-blue-50"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1" /> Add Column
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.importantColumns.map((col, idx) => (
                  <div key={idx} className="group flex items-center gap-2">
                    <Input
                      value={col}
                      onChange={(e) => {
                        const newCols = [...formData.importantColumns];
                        newCols[idx] = e.target.value;
                        setFormData({ ...formData, importantColumns: newCols });
                      }}
                      placeholder={`Column ${idx + 1}`}
                      className="bg-gray-50 border-gray-100 focus:bg-white h-9 text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newCols = formData.importantColumns.filter((_, i) => i !== idx);
                        setFormData({ ...formData, importantColumns: newCols });
                      }}
                      className="h-9 w-9 text-slate-300 hover:text-rose-500 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
                {formData.importantColumns.length === 0 && (
                  <p className="col-span-full text-center py-4 text-[11px] text-slate-400 italic">
                    Add column names that are critical for tracker accuracy
                  </p>
                )}
              </div>
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
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 rounded transition-all border-none"
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
