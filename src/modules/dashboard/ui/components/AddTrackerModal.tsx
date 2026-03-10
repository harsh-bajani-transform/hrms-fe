import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  User,
  Calendar,
  Briefcase,
  ListChecks,
  Clock,
  FileText,
  Plus,
  Loader2,
  Upload,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  SearchableCombobox,
  SearchableComboboxItem,
} from "@/components/common/SearchableCombobox";
import { ProjectRef, TaskRef, UserRef } from "../../types";
import { addTracker } from "../../../../services/qcService";
import { log, logError } from "../../../../config/environment";

interface AddTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  agents: UserRef[];
  projects: ProjectRef[];
}

const SHIFT_TYPES = [
  { label: "Day", value: "day" },
  { label: "Night", value: "night" },
];

const AddTrackerModal: React.FC<AddTrackerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  agents,
  projects,
}) => {
  const [formData, setFormData] = useState({
    agent_id: "",
    tracker_datetime: "",
    project_id: "",
    task_id: "",
    shift_type: "day",
    production: "",
    base_target: "",
    tracker_note: "",
  });
  const [trackerFile, setTrackerFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        agent_id: "",
        tracker_datetime: "",
        project_id: "",
        task_id: "",
        shift_type: "day",
        production: "",
        base_target: "",
        tracker_note: "",
      });
      setTrackerFile(null);
      setErrors({});
    }
  }, [isOpen]);

  const selectedProject = useMemo(() => {
    return projects.find((p) => String(p.project_id) === formData.project_id);
  }, [projects, formData.project_id]);

  const availableTasks = useMemo(() => {
    return selectedProject?.tasks || [];
  }, [selectedProject]);

  // Auto-calculate base target
  useEffect(() => {
    if (formData.agent_id && formData.task_id) {
      const selectedAgent = agents.find(
        (a) => String(a.user_id) === formData.agent_id,
      );
      const selectedTask = availableTasks.find(
        (t) => String(t.task_id) === formData.task_id,
      );

      if (selectedAgent?.user_tenure && selectedTask?.task_target) {
        const calculated =
          Number(selectedTask.task_target) * Number(selectedAgent.user_tenure);
        setFormData((prev) => ({
          ...prev,
          base_target: calculated.toFixed(2),
        }));
      }
    }
  }, [formData.agent_id, formData.task_id, agents, availableTasks]);

  const agentItems = useMemo<SearchableComboboxItem[]>(() => {
    return agents.map((a) => ({
      value: String(a.user_id),
      label: a.user_name || "Unknown Agent",
    }));
  }, [agents]);

  const projectItems = useMemo<SearchableComboboxItem[]>(() => {
    return projects.map((p) => ({
      value: String(p.project_id),
      label: p.project_name || "Unknown Project",
    }));
  }, [projects]);

  const taskItems = useMemo<SearchableComboboxItem[]>(() => {
    return availableTasks.map((t) => ({
      value: String(t.task_id),
      label: t.task_name || t.label || "Unknown Task",
    }));
  }, [availableTasks]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.agent_id) newErrors.agent_id = "Agent is required";
    if (!formData.tracker_datetime)
      newErrors.tracker_datetime = "Date & Time is required";
    if (!formData.project_id) newErrors.project_id = "Project is required";
    if (!formData.task_id) newErrors.task_id = "Task is required";
    if (!formData.production) newErrors.production = "Production is required";
    if (isNaN(Number(formData.production)) || Number(formData.production) < 0)
      newErrors.production = "Invalid production";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // Format datetime for backend (yyyy-MM-dd HH:mm:ss)
      const formattedDate = formData.tracker_datetime.replace("T", " ") + ":00";

      const data = new FormData();
      data.append("user_id", formData.agent_id);
      data.append("date", formattedDate);
      data.append("project_id", formData.project_id);
      data.append("task_id", formData.task_id);
      data.append("shift", formData.shift_type);
      data.append("production", formData.production);
      data.append("tenure_target", formData.base_target);
      if (formData.tracker_note)
        data.append("tracker_note", formData.tracker_note);
      if (trackerFile) data.append("tracker_file", trackerFile);

      log("[AddTrackerModal] Submitting tracker:", formData);
      const res = await addTracker(data);

      if (res.status === 201 || res.status === 200) {
        toast.success("Tracker added successfully");
        onSuccess();
        onClose();
      } else {
        toast.error(res.message || "Failed to add tracker");
      }
    } catch (err: any) {
      logError("[AddTrackerModal] Error adding tracker:", err);
      toast.error(err.response?.data?.message || "Error adding tracker");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      modal={false}
    >
      <DialogContent className="max-w-7xl p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
        <DialogHeader className="bg-blue-600 px-6 py-5 flex flex-row items-center justify-between space-y-0 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                Add Manual Tracker
              </DialogTitle>
              <p className="text-blue-100 text-xs">
                Create a new tracker entry for an agent
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 ">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Agent Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <User className="w-3 h-3" /> Agent
              </Label>
              <SearchableCombobox
                items={agentItems}
                value={formData.agent_id}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, agent_id: val }))
                }
                placeholder="Search Agent..."
              />
              {errors.agent_id && (
                <p className="text-[10px] text-red-500 font-bold">
                  {errors.agent_id}
                </p>
              )}
            </div>

            {/* Date & Time */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Date & Time
              </Label>
              <Input
                type="datetime-local"
                value={formData.tracker_datetime}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tracker_datetime: e.target.value,
                  }))
                }
                className="bg-white border-slate-200 rounded-xl h-11"
              />
              {errors.tracker_datetime && (
                <p className="text-[10px] text-red-500 font-bold">
                  {errors.tracker_datetime}
                </p>
              )}
            </div>

            {/* Project Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-3 h-3" /> Project
              </Label>
              <SearchableCombobox
                items={projectItems}
                value={formData.project_id}
                onValueChange={(val) => {
                  setFormData((prev) => ({
                    ...prev,
                    project_id: val,
                    task_id: "",
                  }));
                }}
                placeholder="Search Project..."
              />
              {errors.project_id && (
                <p className="text-[10px] text-red-500 font-bold">
                  {errors.project_id}
                </p>
              )}
            </div>

            {/* Task Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <ListChecks className="w-3 h-3" /> Task
              </Label>
              <SearchableCombobox
                items={taskItems}
                value={formData.task_id}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, task_id: val }))
                }
                placeholder="Search Task..."
                disabled={!formData.project_id}
              />
              {errors.task_id && (
                <p className="text-[10px] text-red-500 font-bold">
                  {errors.task_id}
                </p>
              )}
            </div>

            {/* Shift Type */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3 h-3" /> Shift
              </Label>
              <Select
                value={formData.shift_type}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, shift_type: val }))
                }
              >
                <SelectTrigger className="bg-white border-slate-200 rounded h-11 w-full">
                  <SelectValue placeholder="Select Shift" />
                </SelectTrigger>
                <SelectContent>
                  {SHIFT_TYPES.map((shift) => (
                    <SelectItem key={shift.value} value={shift.value}>
                      {shift.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Production */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3 h-3" /> Production
              </Label>
              <Input
                type="number"
                value={formData.production}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    production: e.target.value,
                  }))
                }
                placeholder="0"
                className="bg-white border-slate-200 rounded-xl h-11"
              />
              {errors.production && (
                <p className="text-[10px] text-red-500 font-bold">
                  {errors.production}
                </p>
              )}
            </div>

            {/* Base Target */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3 h-3" /> Base Target
              </Label>
              <Input
                type="number"
                value={formData.base_target}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    base_target: e.target.value,
                  }))
                }
                placeholder="0"
                className="bg-white border-slate-200 rounded-xl h-11"
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Upload className="w-3 h-3" /> Attachment
              </Label>
              <div className="relative">
                <input
                  type="file"
                  id="tracker-file"
                  className="hidden"
                  onChange={(e) => setTrackerFile(e.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    document.getElementById("tracker-file")?.click()
                  }
                  className="w-full overflow-hidden truncate bg-white border-slate-200 border-dashed rounded-xl h-11 flex justify-start px-3 text-slate-500 font-normal"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {trackerFile ? trackerFile.name : "Choose File (Max 10MB)"}
                </Button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              Notes
            </Label>
            <Textarea
              value={formData.tracker_note}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  tracker_note: e.target.value,
                }))
              }
              placeholder="Add any additional notes here..."
              rows={3}
              className="bg-white border-slate-200 rounded-xl resize-none"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-12 rounded-xl font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Add Tracker"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTrackerModal;
