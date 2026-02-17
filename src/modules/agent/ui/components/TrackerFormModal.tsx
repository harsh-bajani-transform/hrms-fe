import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Save,
  PlusCircle,
  Upload,
  Calendar as CalendarIcon,
  Briefcase,
  ListChecks,
  Target,
  BarChart2,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useAuth } from "../../../../context/AuthContext";
import { useDeviceInfo } from "../../../../hooks/useDeviceInfo";
import { addTracker } from "../../services/agentService";
import { AgentProjectWithTasks, AgentTaskOption } from "../../types";

interface TrackerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projects: AgentProjectWithTasks[];
}

type FieldName = "selectedProject" | "selectedTask" | "productionTarget";

type FieldErrors = Partial<Record<FieldName, string>>;
type FieldTouched = Partial<Record<FieldName, boolean>>;

const asRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const TrackerFormModal: React.FC<TrackerFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projects,
}) => {
  const { user } = useAuth();
  const { device_id, device_type } = useDeviceInfo();

  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [baseTarget, setBaseTarget] = useState<number | "">("");
  const [baseTargetLoading, setBaseTargetLoading] = useState(false);
  const [productionTarget, setProductionTarget] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<FieldTouched>({});

  const [entryDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  const userTenure = useMemo(() => {
    const raw = (user as Record<string, unknown> | null)?.user_tenure;
    const value = Number(raw ?? 0);
    return Number.isFinite(value) ? value : 0;
  }, [user]);

  const tasks = useMemo(() => {
    if (!selectedProject) return [];
    const project = projects.find(
      (p) => String(p.project_id) === String(selectedProject),
    );
    return project?.tasks ?? [];
  }, [selectedProject, projects]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedProject("");
      setSelectedTask("");
      setBaseTarget("");
      setProductionTarget("");
      setFile(null);
      setErrors({});
      setTouched({});
    }
  }, [isOpen]);

  // Update base target when task changes
  useEffect(() => {
    if (!selectedProject || !selectedTask || userTenure <= 0) {
      setBaseTarget("");
      return;
    }

    setBaseTargetLoading(true);
    const task = tasks.find((t) => String(t.task_id) === String(selectedTask));
    const taskTarget = Number((task as AgentTaskOption).task_target ?? 0);
    setBaseTarget(Number.isFinite(taskTarget) ? taskTarget * userTenure : "");
    setBaseTargetLoading(false);
  }, [selectedProject, selectedTask, tasks, userTenure]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileObj = e.target.files?.[0];
    if (!fileObj) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileObj.size > maxSize) {
      toast.error("File size exceeds 10MB limit");
      e.target.value = "";
      return;
    }
    setFile(fileObj);
  };

  const validate = useCallback((): FieldErrors => {
    const newErrors: FieldErrors = {};
    if (!selectedProject) newErrors.selectedProject = "Project is required.";
    if (!selectedTask) newErrors.selectedTask = "Task is required.";
    if (!productionTarget) {
      newErrors.productionTarget = "Production Target is required.";
    } else if (
      isNaN(Number(productionTarget)) ||
      Number(productionTarget) < 0
    ) {
      newErrors.productionTarget = "Enter a valid number.";
    }
    return newErrors;
  }, [selectedProject, selectedTask, productionTarget]);

  const handleBlur = (field: FieldName) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      selectedProject: true,
      selectedTask: true,
      productionTarget: true,
    });

    const clientErrors = validate();
    setErrors(clientErrors);

    if (Object.keys(clientErrors).length > 0) {
      toast.error("Please fix the errors before submitting.");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("project_id", selectedProject);
    formData.append("task_id", selectedTask);
    formData.append("user_id", String(user?.user_id || ""));
    formData.append("production", productionTarget);
    formData.append("tenure_target", String(baseTarget || 0));
    formData.append("logged_in_user_id", String(user?.user_id || ""));
    formData.append("device_id", device_id || "web");
    formData.append("device_type", device_type || "Laptop");

    if (file) {
      formData.append("tracker_file", file);
    }

    try {
      const res = await addTracker(formData);
      if (
        asRecord(res) &&
        asRecord(res.data) &&
        (res.data.status === 201 || res.data.status === 200)
      ) {
        toast.success("Tracker added successfully!");
        onSuccess();
        onClose();
      } else {
        const message =
          asRecord(res) && asRecord(res.data) ? res.data.message : undefined;
        toast.error(
          (typeof message === "string" && message) || "Failed to add tracker.",
        );
      }
    } catch (err) {
      console.error("[TrackerFormModal] Error submitting tracker:", err);
      toast.error("Failed to add tracker.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-white">
        <DialogHeader className="p-6 bg-blue-600 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <PlusCircle className="w-6 h-6" />
                New Production Entry
              </DialogTitle>
              <p className="text-blue-100 text-sm font-medium">
                Logging output as{" "}
                <span className="text-white font-semibold">
                  {user?.user_name || user?.name || "-"}
                </span>
              </p>
            </div>
            <Badge
              variant="outline"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border-white/20 text-white h-fit"
            >
              <CalendarIcon className="w-4 h-4" />
              <span className="font-semibold text-sm">{entryDate}</span>
            </Badge>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Briefcase className="w-4 h-4 text-blue-600" />
                Project Name <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={selectedProject}
                onValueChange={(val) => {
                  setSelectedProject(val);
                  setTouched((prev) => ({ ...prev, selectedProject: true }));
                }}
              >
                <SelectTrigger
                  className={`rounded-xl h-11 bg-slate-50 ${touched.selectedProject && errors.selectedProject ? "border-destructive ring-destructive/20" : "border-slate-200"}`}
                >
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.project_id} value={String(p.project_id)}>
                      {p.project_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {touched.selectedProject && errors.selectedProject && (
                <p className="text-xs text-rose-500 font-medium">
                  {errors.selectedProject}
                </p>
              )}
            </div>

            {/* Task Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ListChecks className="w-4 h-4 text-blue-600" />
                Task Name <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={selectedTask}
                onValueChange={(val) => {
                  setSelectedTask(val);
                  setTouched((prev) => ({ ...prev, selectedTask: true }));
                }}
                disabled={!selectedProject}
              >
                <SelectTrigger
                  className={`rounded-xl h-11 bg-slate-50 ${touched.selectedTask && errors.selectedTask ? "border-destructive ring-destructive/20" : "border-slate-200"}`}
                >
                  <SelectValue placeholder="Select Task" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((t) => (
                    <SelectItem key={t.task_id} value={String(t.task_id)}>
                      {t.task_name ||
                        ((t as Record<string, unknown>).label as string)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {touched.selectedTask && errors.selectedTask && (
                <p className="text-xs text-rose-500 font-medium">
                  {errors.selectedTask}
                </p>
              )}
            </div>

            {/* Base Target */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Target className="w-4 h-4 text-blue-600" />
                Base Target
              </Label>
              <div className="relative">
                <Input
                  type="text"
                  readOnly
                  disabled
                  value={
                    baseTargetLoading ? "Calculating..." : baseTarget || "-"
                  }
                  className="rounded-xl h-11 bg-slate-100 border-slate-200 text-slate-600 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            {/* Production Target */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                Production <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="number"
                min="0"
                placeholder="Enter value"
                className={`rounded-xl h-11 bg-slate-50 ${touched.productionTarget && errors.productionTarget ? "border-destructive ring-destructive/20" : "border-slate-200"}`}
                value={productionTarget}
                onChange={(e) => setProductionTarget(e.target.value)}
                onBlur={() => handleBlur("productionTarget")}
              />
              {touched.productionTarget && errors.productionTarget && (
                <p className="text-xs text-rose-500 font-medium">
                  {errors.productionTarget}
                </p>
              )}
            </div>
          </div>

          {/* File Upload Area */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Upload className="w-4 h-4 text-blue-600" />
              Project Files
            </Label>
            <div
              className="group relative flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-6 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer bg-slate-50"
              onClick={() =>
                document.getElementById("tracker-file-upload")?.click()
              }
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-white shadow-sm border border-slate-200 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform text-blue-600">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-800">
                    {file ? file.name : "Choose a file or drag & drop"}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-wider">
                    PDF, Image, Excel (Max 10MB)
                  </p>
                </div>
              </div>
              <input
                id="tracker-file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.csv"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 h-11 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-200"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {submitting ? "Submitting..." : "Submit Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TrackerFormModal;
