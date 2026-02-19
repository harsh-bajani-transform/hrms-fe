import React, { useCallback, useEffect, useState } from "react";
import { Save, Folder, CheckSquare, BarChart2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TrackerRow, ProjectRef, TaskRef } from "../../../dashboard/types";
import { fetchDropdownData } from "../../../dashboard/services/dashboardService";
import { updateTrackerEntry } from "../../../tracker/services/trackerService";
import { useAuth, type User } from "../../../../context/AuthContext";

interface TrackerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracker: TrackerRow | null;
  onSuccess: () => void;
}

export const TrackerEditModal: React.FC<TrackerEditModalProps> = ({
  isOpen,
  onClose,
  tracker,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectRef[]>([]);
  const [tasks, setTasks] = useState<TaskRef[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    project_id: "",
    task_id: "",
    production: "",
    base_target: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchDropdownData({
        dropdown_type: "projects with tasks",
        logged_in_user_id: user?.user_id,
      });
      if (res.status === 200) {
        setProjects((res.data as ProjectRef[]) || []);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
      if (tracker) {
        setFormData({
          project_id: String(tracker.project_id || ""),
          task_id: String(tracker.task_id || ""),
          production: String(tracker.production || ""),
          base_target: String(tracker.tenure_target || ""),
        });
      }
    }
  }, [isOpen, tracker, user?.user_id, loadProjects]);

  useEffect(() => {
    if (formData.project_id && projects.length > 0) {
      const project = projects.find(
        (p) => String(p.project_id) === formData.project_id,
      );
      setTasks(project?.tasks || []);
    } else {
      setTasks([]);
    }
  }, [formData.project_id, projects]);

  const handleProjectChange = (val: string) => {
    setFormData((prev) => ({ ...prev, project_id: val, task_id: "" }));
  };

  const handleTaskChange = (val: string) => {
    const task = tasks.find((t) => String(t.task_id) === val);
    const perHourTarget =
      task?.task_target ||
      (task as TaskRef & { per_hour_target?: number }).per_hour_target ||
      (task as TaskRef & { target?: number }).target ||
      0;
    // Assuming user_tenure is available on tracker or context
    const userTenure =
      (tracker as TrackerRow & { user_tenure?: number })?.user_tenure ||
      (user as User & { user_tenure?: number })?.user_tenure ||
      1;
    const baseTarget = Number(perHourTarget) * Number(userTenure);

    setFormData((prev) => ({
      ...prev,
      task_id: val,
      base_target: String(baseTarget),
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must not exceed 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_id || !formData.task_id || !formData.production) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const submitData = new FormData();
      if (tracker?.tracker_id)
        submitData.append("tracker_id", String(tracker.tracker_id));
      submitData.append("project_id", formData.project_id);
      submitData.append("task_id", formData.task_id);
      submitData.append("production", formData.production);
      submitData.append("base_target", formData.base_target);
      if (tracker?.user_id)
        submitData.append("user_id", String(tracker.user_id));

      if (selectedFile) {
        submitData.append("tracker_file", selectedFile);
      }

      const res = await updateTrackerEntry(submitData);
      if (res.status === 200 || res.status === true) {
        toast.success("Tracker updated successfully");
        onSuccess();
        onClose();
      } else {
        toast.error(res.message || "Failed to update tracker");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("An error occurred while updating");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-white">
        <DialogHeader className="p-6 bg-blue-600 text-white">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <Save className="w-6 h-6" />
            Edit Tracker Entry
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Folder className="w-4 h-4 text-blue-600" />
                Project
              </Label>
              <Select
                value={formData.project_id}
                onValueChange={handleProjectChange}
                disabled={loading || submitting}
              >
                <SelectTrigger className="rounded">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem
                      key={String(p.project_id)}
                      value={String(p.project_id)}
                    >
                      {p.project_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                Task
              </Label>
              <Select
                value={formData.task_id}
                onValueChange={handleTaskChange}
                disabled={loading || submitting || !formData.project_id}
              >
                <SelectTrigger className="rounded">
                  <SelectValue placeholder="Select Task" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((t) => (
                    <SelectItem
                      key={String(t.task_id)}
                      value={String(t.task_id)}
                    >
                      {t.task_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                Production
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
                disabled={submitting}
                placeholder="Enter production qty"
                className="rounded"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Save className="w-4 h-4 text-blue-600" />
                Target (Calculated)
              </Label>
              <Input
                type="number"
                value={formData.base_target}
                disabled
                className="bg-slate-50 rounded"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Upload className="w-4 h-4 text-blue-600" />
              Proof File (Optional)
            </Label>
            <Input
              type="file"
              onChange={handleFileChange}
              disabled={submitting}
              className="rounded cursor-pointer"
            />
            {tracker?.tracker_file && (
              <p className="text-xs text-blue-600 font-medium">
                Current file: {tracker.tracker_file.split("/").pop()}
              </p>
            )}
          </div>

          <DialogFooter className="pt-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="rounded px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="rounded px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
