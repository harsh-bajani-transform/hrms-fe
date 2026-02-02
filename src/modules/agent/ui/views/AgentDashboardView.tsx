import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { toast } from "react-hot-toast";
import { fetchDropdowns, addTracker } from "../../services/agentService";
import { fileToBase64 } from "../../../../lib/fileToBase64";
import { useAuth } from "../../../../context/AuthContext";

import TrackerTable from "../components/TrackerTable";
import AgentTabsNavigation from "../components/AgentTabsNavigation";
import AgentProjectList from "../components/AgentProjectList";
import AppLayout from "../../../../components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Calendar as CalendarIcon,
  Upload,
  ChevronRight,
} from "lucide-react";
import {
  type AgentTabId,
  type AgentTaskOption,
  type AgentProjectWithTasks,
  type AddTrackerPayload,
} from "../../types";
import AgentBillableReport from "../components/AgentBillableReport";

export interface AgentDashboardViewProps {
  embedded?: boolean;
}

type FieldName =
  | "selectedProject"
  | "selectedTask"
  | "baseTarget"
  | "productionTarget";

type FieldErrors = Partial<Record<FieldName, string>>;
type FieldTouched = Partial<Record<FieldName, boolean>>;

const asRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const AgentDashboardView = ({ embedded = false }: AgentDashboardViewProps) => {
  const { user } = useAuth();
  const isAdmin =
    user?.role_name === "admin" ||
    user?.role_name === "superadmin" ||
    Boolean((user as Record<string, unknown> | null)?.isSuperAdmin);

  const [projects, setProjects] = useState<AgentProjectWithTasks[]>([]);
  const [tasks, setTasks] = useState<AgentTaskOption[]>([]);
  const [activeTab, setActiveTab] = useState<AgentTabId>("overview");
  const [viewAll, setViewAll] = useState(false);

  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [baseTarget, setBaseTarget] = useState<number | "">("");
  const [baseTargetLoading, setBaseTargetLoading] = useState(false);
  const [productionTarget, setProductionTarget] = useState<string>("");

  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);

  const [loadingTasks, setLoadingTasks] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<FieldTouched>({});
  const [, forceUpdate] = useState<number>(0);

  // Date state for header (default to today)
  const [entryDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  const userTenure = useMemo(() => {
    const raw = (user as Record<string, unknown> | null)?.user_tenure;
    const value = Number(raw ?? 0);
    return Number.isFinite(value) ? value : 0;
  }, [user]);

  // Fetch projects with tasks for tracker form
  useEffect(() => {
    const fetchProjectsWithTasks = async () => {
      if (user?.user_id == null) return;

      try {
        const payload = {
          dropdown_type: "projects with tasks",
          logged_in_user_id: user.user_id,
        };

        const res: unknown = await fetchDropdowns(payload);
        const data = asRecord(res) ? res.data : undefined;
        setProjects(
          Array.isArray(data) ? (data as AgentProjectWithTasks[]) : [],
        );
      } catch (error) {
        console.error(
          "[AgentDashboard] Error fetching projects with tasks:",
          error,
        );
        setProjects([]);
      } finally {
        setLoadingTasks(false);
      }
    };

    void fetchProjectsWithTasks();
  }, [user?.user_id]);

  // Update tasks when project changes
  useEffect(() => {
    if (!selectedProject) {
      setTasks([]);
      setSelectedTask("");
      setBaseTarget("");
      return;
    }

    setLoadingTasks(true);

    const project = projects.find(
      (p) => String(p.project_id) === String(selectedProject),
    );
    const nextTasks = project?.tasks ?? [];

    setTasks(nextTasks);

    if (!nextTasks.find((t) => String(t.task_id) === String(selectedTask))) {
      setSelectedTask("");
      setBaseTarget("");
    }

    setLoadingTasks(false);
  }, [selectedProject, projects, selectedTask]);

  // Calculate base target
  useEffect(() => {
    if (!selectedProject || !selectedTask || userTenure <= 0) {
      setBaseTarget("");
      return;
    }

    setBaseTargetLoading(true);

    const project = projects.find(
      (p) => String(p.project_id) === String(selectedProject),
    );
    const task = project?.tasks?.find(
      (t) => String(t.task_id) === String(selectedTask),
    );

    const taskTarget = Number(task?.task_target ?? 0);
    setBaseTarget(
      task && Number.isFinite(taskTarget) ? taskTarget * userTenure : "",
    );

    setBaseTargetLoading(false);
  }, [selectedProject, selectedTask, projects, userTenure]);

  // Handle file upload
  const handleFileChange = async (
    e: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const fileObj = e.target.files?.[0];
    if (!fileObj) return;

    setFile(fileObj);

    try {
      const base64 = await fileToBase64(fileObj);
      setFileBase64(base64);
    } catch (error) {
      console.error("[AgentDashboard] Error converting file:", error);
      setFileBase64(null);
      toast.error("Failed to process file");
    }
  };

  // Live validation function
  const validate = (): FieldErrors => {
    const newErrors: FieldErrors = {};

    if (!selectedProject) newErrors.selectedProject = "Project is required.";
    if (!selectedTask) newErrors.selectedTask = "Task is required.";
    if (!baseTarget) newErrors.baseTarget = "Base Target is required.";
    if (!productionTarget) {
      newErrors.productionTarget = "Production Target is required.";
    } else if (
      Number.isNaN(Number(productionTarget)) ||
      Number(productionTarget) < 0
    ) {
      newErrors.productionTarget = "Enter a valid number.";
    }

    return newErrors;
  };

  // Live validation on field change
  useEffect(() => {
    setErrors(validate());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject, selectedTask, baseTarget, productionTarget]);

  // Handle blur for live validation
  const handleBlur = (field: FieldName) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate());
  };

  // Handle form submit
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setTouched({
      selectedProject: true,
      selectedTask: true,
      baseTarget: true,
      productionTarget: true,
    });

    setTimeout(async () => {
      const clientErrors = validate();
      setErrors(clientErrors);
      forceUpdate((n) => n + 1);

      if (Object.keys(clientErrors).length > 0) {
        return;
      }

      setSubmitting(true);

      const payload: AddTrackerPayload = {
        project_id: Number(selectedProject),
        task_id: Number(selectedTask),
        user_id: user?.user_id,
        production: Number(productionTarget),
        tenure_target: Number(baseTarget || 0),
        ...(fileBase64 ? { tracker_file: fileBase64 } : {}),
      };

      try {
        const res = await addTracker(payload);

        if (asRecord(res) && asRecord(res.data) && res.data.status === 201) {
          toast.success("Tracker added successfully!");
          setSelectedProject("");
          setSelectedTask("");
          setBaseTarget("");
          setProductionTarget("");
          setFile(null);
          setFileBase64(null);
          setTouched({});
          setTimeout(() => setViewAll(true), 500);
        } else {
          const message =
            asRecord(res) && asRecord(res.data) ? res.data.message : undefined;
          toast.error(
            (typeof message === "string" && message) ||
              "Failed to add tracker.",
          );
        }
      } catch (err: unknown) {
        console.error("[AgentDashboard] Error submitting tracker:", err);
        // Error handling logic...
        toast.error("Failed to add tracker.");
      } finally {
        setSubmitting(false);
      }
    }, 0);
  };

  const handleViewAll = () => setViewAll(true);
  const handleBackToForm = () => setViewAll(false);

  const content = (
    <div className="space-y-8 max-w-7xl mx-auto pb-10 px-4 pt-8 animate-in fade-in duration-500">
      {/* Navigation Tabs */}
      <AgentTabsNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "overview" && (
        <div className="mt-4">
          {viewAll ? (
            <TrackerTable
              userId={isAdmin ? null : user?.user_id}
              projects={projects}
              onClose={handleBackToForm}
            />
          ) : (
            <div className="space-y-8 max-w-6xl mx-auto">
              <div className="flex justify-center py-4">
                <Card className="w-full max-w-2xl shadow-2xl border-none overflow-hidden rounded-3xl animate-in zoom-in-95 duration-300">
                  <div className="h-2 bg-blue-600 w-full" />
                  <CardHeader className="bg-slate-50/70 border-b border-slate-100 px-8 py-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                          <PlusCircle className="w-6 h-6 text-blue-600" />
                          New Production Entry
                        </CardTitle>
                        <p className="text-slate-500 text-sm font-medium">
                          Logging output as{" "}
                          <span className="text-blue-600 font-bold">
                            {user?.user_name || user?.name || "-"}
                          </span>
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-2 px-4 py-2 bg-white shadow-sm border-slate-200 text-slate-700 h-fit"
                      >
                        <CalendarIcon className="w-4 h-4 text-blue-600" />
                        <span className="font-black text-sm">{entryDate}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                        {/* Left Column */}
                        <div className="space-y-8">
                          <div className="space-y-2.5">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                              Project Name{" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <Select
                              value={selectedProject}
                              onValueChange={(val) => setSelectedProject(val)}
                            >
                              <SelectTrigger
                                className={`h-12 w-full text-base font-semibold ${touched.selectedProject && errors.selectedProject ? "border-destructive ring-destructive/20" : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"}`}
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
                            {touched.selectedProject &&
                              errors.selectedProject && (
                                <p className="text-[10px] text-rose-500 font-black uppercase tracking-wider ml-1">
                                  {errors.selectedProject}
                                </p>
                              )}
                          </div>

                          <div className="space-y-2.5">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                              Task Name <span className="text-rose-500">*</span>
                            </label>
                            <Select
                              value={selectedTask}
                              onValueChange={(val) => setSelectedTask(val)}
                              disabled={!selectedProject || loadingTasks}
                            >
                              <SelectTrigger
                                className={`h-12 w-full text-base font-semibold ${touched.selectedTask && errors.selectedTask ? "border-destructive ring-destructive/20" : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"}`}
                              >
                                <SelectValue placeholder="Select Task" />
                              </SelectTrigger>
                              <SelectContent>
                                {tasks.map((t) => (
                                  <SelectItem
                                    key={t.task_id}
                                    value={String(t.task_id)}
                                  >
                                    {t.task_name || t.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {touched.selectedTask && errors.selectedTask && (
                              <p className="text-[10px] text-rose-500 font-black uppercase tracking-wider ml-1">
                                {errors.selectedTask}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-8">
                          <div className="space-y-2.5">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                              Base Target
                            </label>
                            <div className="relative">
                              <Input
                                type="text"
                                readOnly
                                disabled
                                value={
                                  baseTargetLoading ? "" : baseTarget || "-"
                                }
                                className="h-12 bg-slate-50/50 border-slate-200 text-slate-700 font-black text-lg shadow-inner cursor-not-allowed pr-10"
                              />
                              {baseTargetLoading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                              Production Target{" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <Input
                              type="number"
                              min="0"
                              placeholder="Enter value"
                              className={`h-12 text-lg font-black transition-all ${touched.productionTarget && errors.productionTarget ? "border-destructive ring-destructive/20" : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"}`}
                              value={productionTarget}
                              onChange={(e) =>
                                setProductionTarget(e.target.value)
                              }
                              onBlur={() => handleBlur("productionTarget")}
                            />
                            {touched.productionTarget &&
                              errors.productionTarget && (
                                <p className="text-[10px] text-rose-500 font-black uppercase tracking-wider ml-1">
                                  {errors.productionTarget}
                                </p>
                              )}
                          </div>
                        </div>
                      </div>

                      {/* File Upload Area */}
                      <div className="space-y-2.5 pt-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                          Project Files
                        </label>
                        <div
                          className="group relative flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-10 hover:border-blue-400 hover:bg-blue-50/40 transition-all cursor-pointer bg-slate-50/30"
                          onClick={() =>
                            document.getElementById("tracker-file")?.click()
                          }
                        >
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-14 h-14 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Upload className="w-7 h-7 text-blue-600" />
                            </div>
                            <div className="text-center">
                              <p className="text-base font-bold text-slate-800">
                                {file
                                  ? file.name
                                  : "Choose a file or drag & drop"}
                              </p>
                              <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-tighter">
                                PDF, Image, Excel (Max 5MB)
                              </p>
                            </div>
                          </div>
                          <input
                            id="tracker-file"
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-5 pt-6">
                        <Button
                          type="submit"
                          className="flex-1 h-14 text-lg font-black shadow-xl shadow-blue-200 bg-blue-600 hover:bg-blue-700 text-white border-none rounded-2xl transition-all active:scale-95"
                          disabled={submitting}
                        >
                          {submitting ? (
                            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          ) : (
                            <PlusCircle className="w-6 h-6 mr-2" />
                          )}
                          Submit Entry
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 h-14 text-lg font-black bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl transition-all active:scale-95 shadow-sm"
                          onClick={handleViewAll}
                        >
                          View Recent History
                          <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "projects" && (
        <div className="animate-in slide-in-from-bottom-5 duration-500">
          <AgentProjectList />
        </div>
      )}

      {activeTab === "billable_report" && (
        <div className="animate-in slide-in-from-bottom-5 duration-500">
          <AgentBillableReport />
        </div>
      )}
    </div>
  );

  return embedded ? content : <AppLayout>{content}</AppLayout>;
};

export default AgentDashboardView;
