import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Upload,
  Brain,
  FileSearch,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Briefcase,
  ListChecks,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  Lightbulb,
  Copy,
  BarChart,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useAuth } from "../../../../context/AuthContext";
import { aiEvaluate, aiDuplicateCheck } from "../../services/agentService";
import { toast } from "sonner";
import {
  AIEvalResult,
  AIEvaluationProps,
  AISuggestion,
  AgentTaskOption,
  DuplicateCheckResult,
} from "../../types";
import { Badge } from "@/components/ui/badge";

const AIEvaluation: React.FC<AIEvaluationProps> = ({ projects }) => {
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  // States
  const [isAIEvaluating, setIsAIEvaluating] = useState(false);
  const [aiEvalProgress, setAiEvalProgress] = useState(0);
  const [aiEvalSuccess, setAiEvalSuccess] = useState<boolean | null>(null);
  const [aiEvalError, setAiEvalError] = useState("");
  const [aiEvalResult, setAiEvalResult] = useState<AIEvalResult | null>(null);

  const [isDuplicateChecking, setIsDuplicateChecking] = useState(false);
  const [duplicateCheckProgress, setDuplicateCheckProgress] = useState(0);
  const [duplicateCheckSuccess, setDuplicateCheckSuccess] = useState<
    boolean | null
  >(null);
  const [duplicateCheckError, setDuplicateCheckError] = useState("");
  const [duplicateCheckResult, setDuplicateCheckResult] =
    useState<DuplicateCheckResult | null>(null);

  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(
    null,
  );
  const [suggestionFilter, setSuggestionFilter] = useState<
    "all" | "high" | "medium" | "low"
  >("all");
  const [activeResultView, setActiveResultView] = useState<"eval" | "dup">(
    "eval",
  );

  // Gemini API key — read from sessionStorage and react to storage events
  const [geminiApiKey, setGeminiApiKey] = useState<string>(
    () => sessionStorage.getItem("gemini_api_key") || "",
  );
  useEffect(() => {
    const sync = () =>
      setGeminiApiKey(sessionStorage.getItem("gemini_api_key") || "");
    window.addEventListener("storage", sync);
    window.addEventListener("gemini-key-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("gemini-key-updated", sync);
    };
  }, []);

  const tasks = React.useMemo(() => {
    if (!selectedProject) return [];
    const project = projects.find(
      (p) => String(p.project_id) === String(selectedProject),
    );
    return project?.tasks ?? [];
  }, [selectedProject, projects]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileObj = e.target.files?.[0];
    if (!fileObj) return;

    const maxSize = 10 * 1024 * 1024;
    if (fileObj.size > maxSize) {
      toast.error("File size exceeds 10MB limit");
      return;
    }
    setFile(fileObj);
    resetStatus();
  };

  const resetStatus = () => {
    setAiEvalSuccess(null);
    setAiEvalProgress(0);
    setAiEvalError("");
    setAiEvalResult(null);
    setDuplicateCheckSuccess(null);
    setDuplicateCheckProgress(0);
    setDuplicateCheckError("");
    setDuplicateCheckResult(null);
    setExpandedSuggestion(null);
  };

  const handleAIEvaluation = async () => {
    if (!file || !selectedProject || !selectedTask) {
      toast.error("Please select project, task and upload a file");
      return;
    }
    if (!geminiApiKey) {
      toast.error(
        "Gemini API key required — open your profile dropdown and go to 'Gemini AI Key' to add it.",
        { duration: 5000 },
      );
      return;
    }

    setIsAIEvaluating(true);
    setAiEvalProgress(0);
    setAiEvalSuccess(null);
    setAiEvalError("");

    let progressInterval: ReturnType<typeof setInterval> | undefined;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", String(user?.user_id || ""));
      formData.append("project_id", selectedProject);
      formData.append("task_id", selectedTask);
      if (geminiApiKey) formData.append("gemini_api_key", geminiApiKey);

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
        setActiveResultView("eval");
        toast.success("AI Evaluation completed!");
      } else {
        throw new Error(res.message || "AI Evaluation failed");
      }
    } catch (error: unknown) {
      setAiEvalSuccess(false);
      setAiEvalResult(null);
      let msg = "Failed";
      if (error instanceof Error) {
        msg = error.message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "response" in error
      ) {
        msg = (error as any).response?.data?.message || "Failed";
      }
      setAiEvalError(msg);
      toast.error(msg);
    } finally {
      setIsAIEvaluating(false);
    }
  };

  const handleDuplicateCheck = async () => {
    if (!file || !aiEvalSuccess) return;
    if (!geminiApiKey) {
      toast.error(
        "Gemini API key required — open your profile dropdown and go to 'Gemini AI Key' to add it.",
        { duration: 5000 },
      );
      return;
    }

    setIsDuplicateChecking(true);
    setDuplicateCheckProgress(0);
    setDuplicateCheckSuccess(null);
    setDuplicateCheckError("");

    let progressInterval: ReturnType<typeof setInterval> | undefined;

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
        setActiveResultView("dup");
        if (res.data.hasDuplicates) {
          toast.error(`Found ${res.data.duplicateCount} duplicates`);
        } else {
          toast.success("No duplicates found!");
        }
      } else {
        throw new Error(res.message || "Duplicate check failed");
      }
    } catch (error: unknown) {
      setDuplicateCheckSuccess(false);
      setDuplicateCheckResult(null);
      let msg = "Failed";
      if (error instanceof Error) {
        msg = error.message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "response" in error
      ) {
        msg = (error as any).response?.data?.message || "Failed";
      }
      setDuplicateCheckError(msg);
      toast.error(msg);
    } finally {
      setIsDuplicateChecking(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6 animate-in fade-in duration-500">
      <Card className="border-none shadow-xl bg-white overflow-hidden rounded-2xl">
        <CardHeader className="bg-blue-600 text-white p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded flex items-center justify-center border border-white/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                AI Evaluation Hub
                <Sparkles className="w-5 h-5 text-blue-200 animate-pulse" />
              </CardTitle>
              <CardDescription className="text-blue-100 font-medium">
                Validate your project files with advanced AI evaluation and
                duplicate checking
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Project Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <Briefcase className="w-4 h-4 text-blue-600" />
                Select Project
              </Label>
              <Select
                value={selectedProject}
                onValueChange={setSelectedProject}
              >
                <SelectTrigger className="rounded w-full h-12 bg-slate-50 border-slate-200 focus:ring-blue-500 focus:border-blue-500">
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
            </div>

            {/* Task Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <ListChecks className="w-4 h-4 text-blue-600" />
                Select Task
              </Label>
              <Select
                value={selectedTask}
                onValueChange={setSelectedTask}
                disabled={!selectedProject}
              >
                <SelectTrigger className="rounded w-full h-12 bg-slate-50 border-slate-200 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue placeholder="Select Task" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((t) => (
                    <SelectItem key={t.task_id} value={String(t.task_id)}>
                      {t.task_name || (t as AgentTaskOption).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Upload className="w-4 h-4 text-blue-600" />
              Upload Project File
            </Label>
            <div
              className={`group relative flex flex-col items-center justify-center border-2 border-dashed rounded p-10 transition-all cursor-pointer ${
                file
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50"
              }`}
              onClick={() => document.getElementById("ai-file-upload")?.click()}
            >
              <div className="flex flex-col items-center gap-4">
                <div
                  className={`w-14 h-14 shadow-sm border rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                    file
                      ? "bg-emerald-500 text-white border-emerald-400"
                      : "bg-white text-blue-600 border-slate-200"
                  }`}
                >
                  {file ? (
                    <CheckCircle className="w-7 h-7" />
                  ) : (
                    <Upload className="w-7 h-7" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-slate-800">
                    {file ? file.name : "Click to browse or drag and drop"}
                  </p>
                  <p className="text-xs text-slate-500 font-semibold mt-2 uppercase tracking-widest">
                    Support Excel & CSV (MAX 10MB)
                  </p>
                </div>
                {file && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4 h-8 w-8 p-0 rounded-full hover:bg-rose-100 hover:text-rose-600 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      resetStatus();
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <input
                id="ai-file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".xls,.xlsx,.csv"
              />
            </div>
          </div>

          {/* Action Steps */}
          {file && (
            <div className="space-y-6 pt-6 border-t border-slate-100">
              {/* API Key Warning */}
              {!geminiApiKey && (
                <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="w-10 h-10 bg-amber-100 rounded flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-sm text-amber-800">
                    <p className="font-bold text-base mb-1">
                      Gemini API Key Required
                    </p>
                    <p className="font-medium opacity-90">
                      To use AI Evaluation, you must provide your own Gemini API
                      key. Click on your avatar in the top right, select{" "}
                      <strong>Gemini AI Key</strong>, and enter your key.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-500">
                {/* AI Evaluation Card */}
                <div
                  className={`p-6 rounded-2xl border transition-all duration-300 ${
                    aiEvalSuccess === true
                      ? "bg-emerald-50 border-emerald-100"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded flex items-center justify-center ${
                          aiEvalSuccess === true
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        <Brain className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-800">
                        1. AI Evaluation
                      </span>
                    </div>
                    {aiEvalSuccess === true && (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    )}
                    {aiEvalSuccess === false && (
                      <AlertCircle className="w-5 h-5 text-rose-500" />
                    )}
                  </div>

                  <Button
                    onClick={handleAIEvaluation}
                    disabled={
                      isAIEvaluating ||
                      isDuplicateChecking ||
                      !selectedProject ||
                      !selectedTask
                    }
                    className={`w-full  rounded font-bold transition-all ${
                      aiEvalSuccess === true
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100"
                    }`}
                  >
                    {isAIEvaluating ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    {aiEvalSuccess === true
                      ? "Re-evaluate Results"
                      : "Run AI Evaluation"}
                  </Button>

                  {isAIEvaluating && (
                    <Progress
                      value={aiEvalProgress}
                      className="h-2 rounded-full mt-4 bg-slate-100"
                    />
                  )}
                  {aiEvalError && (
                    <p className="text-xs text-rose-500 font-bold mt-3 pl-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {aiEvalError}
                    </p>
                  )}
                </div>

                {/* Duplicate Check Card */}
                <div
                  className={`p-6 rounded-2xl border transition-all duration-300 ${
                    duplicateCheckSuccess === true
                      ? "bg-emerald-50 border-emerald-100"
                      : aiEvalSuccess === true
                        ? "bg-white border-slate-200"
                        : "bg-slate-50 border-slate-100 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded flex items-center justify-center ${
                          duplicateCheckSuccess === true
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        <FileSearch className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-800">
                        2. Duplicate Check
                      </span>
                    </div>
                    {duplicateCheckSuccess === true && (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    )}
                    {duplicateCheckSuccess === false && (
                      <AlertCircle className="w-5 h-5 text-rose-500" />
                    )}
                  </div>

                  <Button
                    onClick={handleDuplicateCheck}
                    disabled={
                      !aiEvalSuccess ||
                      isAIEvaluating ||
                      isDuplicateChecking ||
                      duplicateCheckSuccess === true
                    }
                    className={`w-full  rounded font-bold transition-all ${
                      duplicateCheckSuccess === true
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100"
                    }`}
                  >
                    {isDuplicateChecking ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <FileSearch className="w-4 h-4 mr-2" />
                    )}
                    {duplicateCheckSuccess === true
                      ? "Verification Passed"
                      : "Check for Duplicates"}
                  </Button>

                  {isDuplicateChecking && (
                    <Progress
                      value={duplicateCheckProgress}
                      className="h-2 rounded-full mt-4 bg-slate-100"
                    />
                  )}
                  {duplicateCheckError && (
                    <p className="text-xs text-rose-500 font-bold mt-3 pl-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {duplicateCheckError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Result View Toggles */}
          {(aiEvalResult || duplicateCheckResult) && (
            <div className="flex bg-slate-100 p-1.5 rounded w-fit gap-1 animate-in slide-in-from-top-4 duration-500">
              {aiEvalResult && (
                <Button
                  variant={activeResultView === "eval" ? "default" : "ghost"}
                  onClick={() => setActiveResultView("eval")}
                  className={`rounded-lg px-6 font-bold transition-all ${activeResultView === "eval" ? "bg-white text-blue-600 shadow-sm hover:bg-white" : "text-slate-600 hover:text-slate-900"}`}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  AI Evaluation
                </Button>
              )}
              {duplicateCheckResult && (
                <Button
                  variant={activeResultView === "dup" ? "default" : "ghost"}
                  onClick={() => setActiveResultView("dup")}
                  className={`rounded-lg px-6 font-bold transition-all ${activeResultView === "dup" ? "bg-white text-blue-600 shadow-sm hover:bg-white" : "text-slate-600 hover:text-slate-900"}`}
                >
                  <FileSearch className="w-4 h-4 mr-2" />
                  Duplicate Check
                </Button>
              )}
            </div>
          )}

          {/* Detailed Results */}
          {aiEvalResult && activeResultView === "eval" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* AI Summary Card */}
              <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center shrink-0">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-blue-900 mb-2">
                      AI Evaluation Summary
                    </h4>
                    <p className="text-slate-700 leading-relaxed">
                      {typeof aiEvalResult.summary === "string"
                        ? aiEvalResult.summary
                        : aiEvalResult.summary?.summary ||
                          "Evaluation completed successfully."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quality Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-md bg-white overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded flex items-center justify-center">
                        <BarChart className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-500">
                          Quality Score
                        </p>
                        <h5 className="text-2xl font-bold text-slate-900">
                          {aiEvalResult.qualityScore}%
                        </h5>
                      </div>
                    </div>
                    <Progress
                      value={aiEvalResult.qualityScore}
                      className="h-1.5 mt-4"
                    />
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded flex items-center justify-center">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-500">
                          Total Records
                        </p>
                        <h5 className="text-2xl font-bold text-slate-900">
                          {aiEvalResult.details.totalRecords}
                        </h5>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-500">
                          Issues Found
                        </p>
                        <h5 className="text-2xl font-bold text-rose-600">
                          {aiEvalResult.details.issuesFound}
                        </h5>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Critical Issues */}
              {aiEvalResult.criticalIssues &&
                aiEvalResult.criticalIssues.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-rose-500" />
                      Critical Quality Issues
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      {aiEvalResult.criticalIssues.map((issue, idx) => (
                        <div
                          key={idx}
                          className="bg-rose-50/30 border border-rose-100 rounded p-5"
                        >
                          <div className="flex items-start gap-4">
                            <span className="shrink-0 w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm">
                              {idx + 1}
                            </span>
                            <div className="space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-2">
                                <span
                                  className="text-[10px] font-bold uppercase tracking-wider text-rose-500 bg-rose-100/50 px-2 py-0.5 rounded max-w-fit break-all"
                                  title={issue.location}
                                >
                                  {issue.location}
                                </span>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-slate-900">
                                    {issue.issue}
                                  </p>
                                  {issue.affectedRecords !== undefined && (
                                    <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none text-[10px]">
                                      {issue.affectedRecords} records
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-slate-600">
                                <span className="font-semibold text-slate-800">
                                  Impact:
                                </span>{" "}
                                {issue.impact}
                              </p>
                              {issue.fix && (
                                <div className="mt-2 text-sm bg-white/50 border border-rose-100 p-3 rounded-lg">
                                  <span className="font-semibold text-rose-700 block mb-1">
                                    Recommended Fix:
                                  </span>
                                  {issue.fix}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Suggestions View */}
              {(aiEvalResult.suggestions ||
                (typeof aiEvalResult.summary !== "string" &&
                  aiEvalResult.summary?.suggestions)) && (
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-lg">
                  <div className="bg-slate-900 p-6 text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded flex items-center justify-center">
                        <ListChecks className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold">AI Suggestions</h4>
                        <p className="text-slate-400 text-sm">
                          Improvements proposed by AI
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Check if suggestions are objects (row-level) or strings (general) */}
                    {Array.isArray(aiEvalResult.suggestions) &&
                    aiEvalResult.suggestions.length > 0 &&
                    typeof aiEvalResult.suggestions[0] !== "string" ? (
                      <>
                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
                          {(["all", "high", "medium", "low"] as const).map(
                            (filter) => {
                              const suggestions =
                                (aiEvalResult.suggestions as AISuggestion[]) ||
                                [];
                              const count =
                                filter === "all"
                                  ? suggestions.length
                                  : suggestions.filter(
                                      (s) => s.severity === filter,
                                    ).length;

                              return (
                                <Button
                                  key={filter}
                                  variant={
                                    suggestionFilter === filter
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() => setSuggestionFilter(filter)}
                                  className={`rounded-full px-4 font-bold capitalize ${suggestionFilter === filter ? (filter === "high" ? "bg-rose-600" : filter === "medium" ? "bg-orange-600" : filter === "low" ? "bg-blue-600" : "bg-slate-900") : ""}`}
                                >
                                  {filter} ({count})
                                </Button>
                              );
                            },
                          )}
                        </div>

                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                          {(aiEvalResult.suggestions as AISuggestion[])
                            .filter(
                              (s) =>
                                suggestionFilter === "all" ||
                                s.severity === suggestionFilter,
                            )
                            .map((suggestion) => (
                              <div
                                key={suggestion.id}
                                className={`border rounded transition-all ${suggestion.severity === "high" ? "border-rose-100 bg-rose-50/20" : suggestion.severity === "medium" ? "border-orange-100 bg-orange-50/20" : "border-blue-100 bg-blue-50/20"}`}
                              >
                                <button
                                  onClick={() =>
                                    setExpandedSuggestion(
                                      expandedSuggestion === suggestion.id
                                        ? null
                                        : suggestion.id,
                                    )
                                  }
                                  className="w-full text-left p-4 flex items-start justify-between gap-4"
                                >
                                  <div className="flex gap-3">
                                    <div className="mt-1">
                                      {suggestion.severity === "high" ? (
                                        <AlertCircle className="w-5 h-5 text-rose-500" />
                                      ) : suggestion.severity === "medium" ? (
                                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                                      ) : (
                                        <Info className="w-5 h-5 text-blue-500" />
                                      )}
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-500">
                                          Row {suggestion.row} /{" "}
                                          {suggestion.column}
                                        </span>
                                      </div>
                                      <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                        {suggestion.issue}
                                      </p>
                                    </div>
                                  </div>
                                  {expandedSuggestion === suggestion.id ? (
                                    <ChevronUp className="w-5 h-5 text-slate-400" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                  )}
                                </button>

                                {expandedSuggestion === suggestion.id && (
                                  <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="bg-white rounded-lg p-4 border border-slate-100 shadow-sm">
                                      <h5 className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2">
                                        <Lightbulb className="w-3 h-3" />
                                        AI Recommendation
                                      </h5>
                                      <p className="text-sm text-slate-700 leading-relaxed">
                                        {suggestion.suggestion}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </>
                    ) : (
                      /* Fallback for general string suggestions */
                      <div className="grid grid-cols-1 gap-4">
                        {(aiEvalResult.suggestions ||
                          (typeof aiEvalResult.summary !== "string" &&
                            aiEvalResult.summary?.suggestions) ||
                          []) &&
                          (
                            (aiEvalResult.suggestions ||
                              (typeof aiEvalResult.summary !== "string" &&
                                aiEvalResult.summary?.suggestions) ||
                              []) as string[]
                          ).map((suggestion, idx) => (
                            <div
                              key={idx}
                              className="bg-emerald-50/50 border border-emerald-100 rounded p-4 flex gap-4"
                            >
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                <CheckCircle className="w-4 h-4" />
                              </div>
                              <p className="text-sm text-slate-700 font-medium">
                                {suggestion}
                              </p>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Duplicate Results View */}
          {duplicateCheckResult && activeResultView === "dup" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div
                className={`rounded-2xl border p-6 ${duplicateCheckResult.hasDuplicates ? "bg-rose-50/50 border-rose-100" : "bg-emerald-50/50 border-emerald-100"}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${duplicateCheckResult.hasDuplicates ? "bg-rose-600" : "bg-emerald-600"}`}
                  >
                    <Copy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4
                      className={`text-lg font-bold mb-1 ${duplicateCheckResult.hasDuplicates ? "text-rose-900" : "text-emerald-900"}`}
                    >
                      {duplicateCheckResult.hasDuplicates
                        ? `Found ${duplicateCheckResult.duplicateCount} Duplicate Records`
                        : "No Duplicates Found"}
                    </h4>
                    <p className="text-slate-600 text-sm font-medium">
                      Checked {duplicateCheckResult.totalRecords} records across
                      matched fields
                    </p>
                  </div>
                </div>
              </div>

              {duplicateCheckResult.hasDuplicates && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                      Duplicate Details
                    </h4>
                  </div>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                    {duplicateCheckResult.duplicates.map((dup, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                          <span className="font-bold text-slate-700">
                            Row {dup.row}
                          </span>
                          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none">
                            Duplicate Entry
                          </Badge>
                        </div>
                        <div className="p-4 space-y-4">
                          <div>
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                              Mismatched / Matched Columns
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {dup.duplicateColumns.map((col) => (
                                <Badge
                                  key={col}
                                  variant="outline"
                                  className="bg-white text-slate-700 border-slate-200"
                                >
                                  {col}: {dup.data[col]}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                              Full Data Snapshot
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-4">
                              {Object.entries(dup.data).map(([key, value]) => (
                                <div
                                  key={key}
                                  className="text-[11px] overflow-hidden"
                                >
                                  <span className="text-slate-500 font-medium whitespace-nowrap">
                                    {key}:
                                  </span>{" "}
                                  <span className="text-slate-800 font-bold break-all">
                                    {String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!file && (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-sm font-semibold italic">
                Upload a file to begin advanced AI validation
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIEvaluation;
