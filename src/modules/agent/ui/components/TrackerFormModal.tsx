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
  Sparkles,
  FileSearch,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  Brain,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  aiEvaluate,
  aiDuplicateCheck,
  processExcel,
} from "../../services/agentService";
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

interface AIEvalDetail {
  location: string;
  issue: string;
  impact?: string;
  fix?: string;
  affectedRecords?: number;
}

interface AISuggestion {
  id: string;
  row: number;
  column: string;
  severity: "high" | "medium" | "low";
  issue: string;
  suggestion: string;
}

interface AIEvalResult {
  message: string;
  qualityScore: number;
  details: {
    totalRecords: number;
    issuesFound: number;
    [key: string]: any;
  };
  criticalIssues?: AIEvalDetail[];
  summary?:
    | string
    | {
        summary: string;
        suggestions?: AISuggestion[] | string[];
        criticalIssues?: AIEvalDetail[];
      };
  suggestions?: AISuggestion[] | string[];
}

interface DuplicateRow {
  row: number;
  duplicateColumns: string[];
  duplicateValues: Record<string, any>;
  data: Record<string, any>;
}

interface DuplicateCheckResult {
  hasDuplicates: boolean;
  duplicateCount: number;
  duplicates: DuplicateRow[];
  totalRecords: number;
  uniqueRecords: number;
}

interface TrackerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projects: AgentProjectWithTasks[];
  isSubmissionWindowOpen: boolean;
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
  isSubmissionWindowOpen,
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

  // AI Evaluation states
  const [isAIEvaluating, setIsAIEvaluating] = useState(false);
  const [aiEvalProgress, setAiEvalProgress] = useState(0);
  const [aiEvalSuccess, setAiEvalSuccess] = useState<boolean | null>(null);
  const [aiEvalError, setAiEvalError] = useState("");
  const [aiEvalResult, setAiEvalResult] = useState<AIEvalResult | null>(null);

  // Duplicate Check states
  const [isDuplicateChecking, setIsDuplicateChecking] = useState(false);
  const [duplicateCheckProgress, setDuplicateCheckProgress] = useState(0);
  const [duplicateCheckSuccess, setDuplicateCheckSuccess] = useState<
    boolean | null
  >(null);
  const [duplicateCheckError, setDuplicateCheckError] = useState("");
  const [duplicateCheckResult, setDuplicateCheckResult] =
    useState<DuplicateCheckResult | null>(null);

  const [expandedSection, setExpandedSection] = useState<
    "eval" | "dup" | "none"
  >("none");
  const [detailsMode, setDetailsMode] = useState<"eval" | "dup">("eval");

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

      // Reset AI/Duplicate states
      setAiEvalSuccess(null);
      setAiEvalProgress(0);
      setAiEvalError("");
      setAiEvalResult(null);
      setDuplicateCheckSuccess(null);
      setDuplicateCheckProgress(0);
      setDuplicateCheckError("");
      setDuplicateCheckResult(null);
      setExpandedSection("none");
      setDetailsMode("eval");
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

  // Handle AI Evaluation
  const handleAIEvaluation = async () => {
    if (!file) {
      toast.error("Please upload a file first");
      return;
    }

    if (!selectedProject || !selectedTask) {
      toast.error("Please select a project and task first");
      return;
    }

    setIsAIEvaluating(true);
    setAiEvalProgress(0);
    setAiEvalSuccess(null);
    setAiEvalError("");

    let progressInterval: any;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", String(user?.user_id || ""));
      formData.append("project_id", selectedProject);
      formData.append("task_id", selectedTask);

      // Simulate progress
      progressInterval = setInterval(() => {
        setAiEvalProgress((prev) => (prev >= 90 ? 90 : prev + 5));
      }, 300);

      const res = await aiEvaluate(formData);
      clearInterval(progressInterval);
      setAiEvalProgress(100);

      if (res.success || res.status === "success") {
        setAiEvalSuccess(true);
        // Correctly handle data structure from backend
        const evalData = res.data;
        const summaryObj = evalData?.summary;

        // If top-level arrays are empty, try fallback to summary object
        if (
          (!evalData.criticalIssues || evalData.criticalIssues.length === 0) &&
          summaryObj?.criticalIssues
        ) {
          evalData.criticalIssues = summaryObj.criticalIssues;
        }

        if (
          (!evalData.suggestions || evalData.suggestions.length === 0) &&
          summaryObj?.suggestions
        ) {
          evalData.suggestions = summaryObj.suggestions;
        }

        setAiEvalResult(evalData);
        setDetailsMode("eval");
        toast.success("AI Evaluation completed!");
      } else {
        throw new Error(res.message || "AI Evaluation failed");
      }
    } catch (error: any) {
      setAiEvalSuccess(false);
      setAiEvalResult(null);
      const msg = error.response?.data?.message || error.message || "Failed";
      setAiEvalError(msg);
      toast.error(msg);
    } finally {
      setIsAIEvaluating(false);
    }
  };

  // Handle Duplicate Check
  const handleDuplicateCheck = async () => {
    if (!file) {
      toast.error("Please upload a file first");
      return;
    }

    if (!aiEvalSuccess) {
      toast.error("Please complete AI Evaluation first");
      return;
    }

    setIsDuplicateChecking(true);
    setDuplicateCheckProgress(0);
    setDuplicateCheckSuccess(null);
    setDuplicateCheckError("");

    let progressInterval: any;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", String(user?.user_id || ""));
      formData.append("project_id", selectedProject);
      formData.append("task_id", selectedTask);

      progressInterval = setInterval(() => {
        setDuplicateCheckProgress((prev) => (prev >= 90 ? 90 : prev + 5));
      }, 300);

      const res = await aiDuplicateCheck(formData);
      clearInterval(progressInterval);
      setDuplicateCheckProgress(100);

      if (res.success) {
        setDuplicateCheckSuccess(true);
        setDuplicateCheckResult(res.data);
        setDetailsMode("dup");
        if (res.data.hasDuplicates) {
          toast.error(`Found ${res.data.duplicateCount} duplicates`);
        } else {
          toast.success("Duplicate check passed!");
        }
      } else {
        throw new Error(res.message || "Duplicate check failed");
      }
    } catch (error: any) {
      setDuplicateCheckSuccess(false);
      setDuplicateCheckResult(null);
      const msg = error.response?.data?.message || error.message || "Failed";
      setDuplicateCheckError(msg);
      toast.error(msg);
    } finally {
      setIsDuplicateChecking(false);
    }
  };

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
        // If file is uploaded, process it for hashes
        if (file) {
          try {
            const processFormData = new FormData();
            processFormData.append("file", file);
            processFormData.append("user_id", String(user?.user_id || ""));
            processFormData.append("project_id", selectedProject);
            processFormData.append("task_id", selectedTask);
            await processExcel(processFormData);
          } catch (processErr) {
            console.error("File processing failed:", processErr);
            toast.warning("Tracker added, but file processing failed.");
          }
        }

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

  const isFormValid =
    selectedProject &&
    selectedTask &&
    productionTarget &&
    Object.keys(errors).length === 0;

  const canSubmit = useMemo(() => {
    // Basic validation
    if (!isFormValid) return false;

    // File requirements
    if (file) {
      if (!aiEvalSuccess || !duplicateCheckSuccess) return false;
    }

    // Submission window (Optional: allow override for admins? For now strict as per requirements)
    if (!isSubmissionWindowOpen) return false;

    return true;
  }, [
    isFormValid,
    file,
    aiEvalSuccess,
    duplicateCheckSuccess,
    isSubmissionWindowOpen,
  ]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-white">
        <DialogHeader className="p-6 bg-blue-600 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <PlusCircle className="w-6 h-6" />
              <DialogTitle className="text-2xl font-bold flex flex-col">
                New Production Entry
                <p className="text-blue-100 text-sm font-medium">
                  Logging output as{" "}
                  <span className="text-white font-semibold">
                    {user?.user_name || user?.name || "-"}
                  </span>
                </p>
              </DialogTitle>
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

        <form
          onSubmit={handleSubmit}
          className="flex flex-col h-full overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[65vh] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
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
                    className={`rounded h-11 bg-slate-50 w-full ${touched.selectedProject && errors.selectedProject ? "border-destructive ring-destructive/20" : "border-slate-200"}`}
                  >
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem
                        key={p.project_id}
                        value={String(p.project_id)}
                      >
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
                    className={`rounded w-full h-11 bg-slate-50 ${touched.selectedTask && errors.selectedTask ? "border-destructive ring-destructive/20" : "border-slate-200"}`}
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
                    className="rounded h-11 bg-slate-100 border-slate-200 text-slate-600 font-medium cursor-not-allowed"
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
                  className={`rounded h-11 bg-slate-50 ${touched.productionTarget && errors.productionTarget ? "border-destructive ring-destructive/20" : "border-slate-200"}`}
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
                className="group relative flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded p-6 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer bg-slate-50"
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
                      Excel only (Max 10MB)
                    </p>
                  </div>
                </div>
                <input
                  id="tracker-file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".xls,.xlsx,.csv"
                />
              </div>
            </div>

            {/* AI Evaluation Steps (Conditional) */}
            {file && (
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Validation Steps Required
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Step 1: AI Evaluation */}
                  <div className="p-4 rounded border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-slate-500">
                          Step 1: AI Evaluation
                        </span>
                        {aiEvalResult && duplicateCheckResult && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setDetailsMode(
                                detailsMode === "eval" ? "dup" : "eval",
                              )
                            }
                            className="h-5 px-1.5 text-[9px] bg-white border border-slate-200 hover:bg-slate-100 font-bold"
                          >
                            Switch to {detailsMode === "eval" ? "Dups" : "AI"}
                          </Button>
                        )}
                      </div>
                      {aiEvalSuccess === true ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : aiEvalSuccess === false ? (
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      onClick={handleAIEvaluation}
                      disabled={
                        isAIEvaluating ||
                        isDuplicateChecking ||
                        !selectedProject ||
                        !selectedTask
                      }
                      variant={aiEvalSuccess ? "outline" : "default"}
                      className="w-full h-9 text-xs font-bold shadow-sm"
                    >
                      {isAIEvaluating ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-2" />
                      ) : (
                        <Brain className="w-3 h-3 mr-2" />
                      )}
                      {aiEvalSuccess ? "Re-evaluate" : "Run AI Eval"}
                    </Button>
                    {isAIEvaluating && (
                      <Progress value={aiEvalProgress} className="h-1" />
                    )}
                    {aiEvalError && (
                      <p className="text-[10px] text-rose-500 font-medium">
                        {aiEvalError}
                      </p>
                    )}

                    {aiEvalResult && detailsMode === "eval" && (
                      <div className="pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedSection(
                              expandedSection === "eval" ? "none" : "eval",
                            )
                          }
                          className="h-7 px-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          {expandedSection === "eval"
                            ? "Hide AI Details"
                            : "Show AI Details"}
                          {expandedSection === "eval" ? (
                            <ChevronUp className="w-3 h-3 ml-1" />
                          ) : (
                            <ChevronDown className="w-3 h-3 ml-1" />
                          )}
                        </Button>
                        {expandedSection === "eval" && (
                          <div className="mt-2 space-y-2 bg-white/50 p-2 rounded border border-slate-200 animate-in slide-in-from-top-1 duration-200">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-500">
                                Quality Score:
                              </span>
                              <span className="font-bold text-blue-600">
                                {aiEvalResult.qualityScore}%
                              </span>
                            </div>
                            {aiEvalResult.criticalIssues &&
                              aiEvalResult.criticalIssues.length > 0 && (
                                <div className="space-y-1 mt-1">
                                  <p className="text-[9px] font-bold text-rose-500 uppercase">
                                    Issues Found (
                                    {aiEvalResult.criticalIssues.length})
                                  </p>
                                  {aiEvalResult.criticalIssues
                                    .slice(0, 3)
                                    .map((issue, i) => (
                                      <p
                                        key={i}
                                        className="text-[10px] text-slate-700 truncate"
                                      >
                                        • {issue.issue}
                                      </p>
                                    ))}
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    )}

                    {duplicateCheckResult && detailsMode === "dup" && (
                      <div className="pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedSection(
                              expandedSection === "dup" ? "none" : "dup",
                            )
                          }
                          className="h-7 px-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          {expandedSection === "dup"
                            ? "Hide Dup Details"
                            : "Show Dup Details"}
                          {expandedSection === "dup" ? (
                            <ChevronUp className="w-3 h-3 ml-1" />
                          ) : (
                            <ChevronDown className="w-3 h-3 ml-1" />
                          )}
                        </Button>
                        {expandedSection === "dup" && (
                          <div className="mt-2 space-y-2 bg-white/50 p-2 rounded border border-slate-200 animate-in slide-in-from-top-1 duration-200">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-500">Result:</span>
                              <span
                                className={`font-bold ${duplicateCheckResult.hasDuplicates ? "text-rose-600" : "text-emerald-600"}`}
                              >
                                {duplicateCheckResult.hasDuplicates
                                  ? "Duplicates Found"
                                  : "Clean"}
                              </span>
                            </div>
                            {duplicateCheckResult.hasDuplicates && (
                              <div className="space-y-1 mt-1">
                                <p className="text-[10px] text-slate-700">
                                  Found{" "}
                                  <span className="font-bold">
                                    {duplicateCheckResult.duplicateCount}
                                  </span>{" "}
                                  duplicate rows.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Step 2: Duplicate Check */}
                  <div className="p-4 rounded border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-slate-500">
                        Step 2: Duplicate Check
                      </span>
                      {duplicateCheckSuccess === true ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : duplicateCheckSuccess === false ? (
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      onClick={handleDuplicateCheck}
                      disabled={
                        !aiEvalSuccess ||
                        isAIEvaluating ||
                        isDuplicateChecking ||
                        duplicateCheckSuccess === true
                      }
                      variant={duplicateCheckSuccess ? "outline" : "default"}
                      className="w-full h-9 text-xs font-bold"
                    >
                      {isDuplicateChecking ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-2" />
                      ) : (
                        <FileSearch className="w-3 h-3 mr-2" />
                      )}
                      {duplicateCheckSuccess
                        ? "Check Passed"
                        : "Check Duplicates"}
                    </Button>
                    {isDuplicateChecking && (
                      <Progress
                        value={duplicateCheckProgress}
                        className="h-1"
                      />
                    )}
                    {duplicateCheckError && (
                      <p className="text-[10px] text-rose-500 font-medium">
                        {duplicateCheckError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-200 flex gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 h-11 rounded border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !canSubmit}
              className={`flex-1 h-11 rounded font-semibold shadow-lg transition-all ${
                canSubmit
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"
                  : "bg-slate-200 text-slate-400 shadow-none cursor-not-allowed"
              }`}
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
