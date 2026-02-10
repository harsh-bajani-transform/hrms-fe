import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  useCallback,
} from "react";
import { toast } from "sonner";
import { fetchDropdowns, addTracker } from "../../services/agentService";
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
import { Label } from "@/components/ui/label";
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
} from "../../types";
import AgentBillableReport from "../components/AgentBillableReport";
import { useDeviceInfo } from "../../../../hooks/useDeviceInfo";

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
  const { device_id, device_type } = useDeviceInfo();
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

  const [loadingTasks, setLoadingTasks] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<FieldTouched>({});

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
  };

  // Live validation function
  const validate = useCallback(
    (projectVal?: string, taskVal?: string): FieldErrors => {
      const newErrors: FieldErrors = {};
      const pVal = projectVal ?? selectedProject;
      const tVal = taskVal ?? selectedTask;

      if (!pVal || pVal === "undefined" || isNaN(Number(pVal))) {
        newErrors.selectedProject = "Project is required.";
      }
      if (!tVal || tVal === "undefined" || isNaN(Number(tVal))) {
        newErrors.selectedTask = "Task is required.";
      }
      if (!baseTarget && baseTarget !== 0) {
        newErrors.baseTarget = "Base Target is required.";
      }
      if (!productionTarget) {
        newErrors.productionTarget = "Production Target is required.";
      } else if (
        Number.isNaN(Number(productionTarget)) ||
        Number(productionTarget) < 0
      ) {
        newErrors.productionTarget = "Enter a valid number.";
      }

      return newErrors;
    },
    [selectedProject, selectedTask, baseTarget, productionTarget],
  );

  // Live validation on field change
  useEffect(() => {
    setErrors(validate());
  }, [validate]);

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

    // Use a small delay to ensure states are synchronized if needed,
    // though here we can just call validate with current values.
    const clientErrors = validate();
    setErrors(clientErrors);

    if (Object.keys(clientErrors).length > 0) {
      toast.error("Please fix the errors before submitting.");
      return;
    }

    const pId = Number(selectedProject);
    const tId = Number(selectedTask);

    if (isNaN(pId) || isNaN(tId)) {
      toast.error("Invalid Project or Task selected.");
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append("project_id", String(pId));
    formData.append("task_id", String(tId));
    formData.append("user_id", String(user?.user_id || ""));
    formData.append("production", String(productionTarget));
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
        setSelectedProject("");
        setSelectedTask("");
        setBaseTarget("");
        setProductionTarget("");
        setFile(null);
        setTouched({});
        setTimeout(() => setViewAll(true), 500);
      } else {
        const message =
          asRecord(res) && asRecord(res.data) ? res.data.message : undefined;
        toast.error(
          (typeof message === "string" && message) || "Failed to add tracker.",
        );
      }
    } catch (err: unknown) {
      console.error("[AgentDashboard] Error submitting tracker:", err);
      toast.error("Failed to add tracker.");
    } finally {
      setSubmitting(false);
    }
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
                <Card className="w-full max-w-2xl shadow-sm border border-gray-200 overflow-hidden rounded-xl">
                  <CardHeader className="bg-linear-to-r from-blue-600 to-blue-700 px-8 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <CardTitle className="text-2xl font-semibold text-white flex items-center gap-2.5">
                          <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                            <PlusCircle className="w-5 h-5 text-white" />
                          </div>
                          New Production Entry
                        </CardTitle>
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
                        <span className="font-semibold text-sm">
                          {entryDate}
                        </span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        {/* Left Column */}
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <Label
                              htmlFor="project-select"
                              className="text-sm font-medium text-gray-700"
                            >
                              Project Name{" "}
                              <span className="text-rose-500">*</span>
                            </Label>
                            <Select
                              value={selectedProject}
                              onValueChange={(val) => setSelectedProject(val)}
                            >
                              <SelectTrigger
                                className={`h-11 w-full bg-gray-50 ${touched.selectedProject && errors.selectedProject ? "border-destructive ring-destructive/20" : "border-gray-200 focus:border-blue-400 focus:ring-blue-100"}`}
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
                                <p className="text-xs text-rose-500 font-medium">
                                  {errors.selectedProject}
                                </p>
                              )}
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="task-select"
                              className="text-sm font-medium text-gray-700"
                            >
                              Task Name <span className="text-rose-500">*</span>
                            </Label>
                            <Select
                              value={selectedTask}
                              onValueChange={(val) => setSelectedTask(val)}
                              disabled={!selectedProject || loadingTasks}
                            >
                              <SelectTrigger
                                className={`h-11 w-full bg-gray-50 ${touched.selectedTask && errors.selectedTask ? "border-destructive ring-destructive/20" : "border-gray-200 focus:border-blue-400 focus:ring-blue-100"}`}
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
                              <p className="text-xs text-rose-500 font-medium">
                                {errors.selectedTask}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <Label
                              htmlFor="base-target"
                              className="text-sm font-medium text-gray-700"
                            >
                              Base Target
                            </Label>
                            <div className="relative">
                              <Input
                                id="base-target"
                                type="text"
                                readOnly
                                disabled
                                value={
                                  baseTargetLoading ? "" : baseTarget || "-"
                                }
                                className=" bg-gray-100 border-gray-200 text-gray-700 font-medium cursor-not-allowed pr-10"
                              />
                              {baseTargetLoading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="production-target"
                              className="text-sm font-medium text-gray-700"
                            >
                              Production Target{" "}
                              <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                              id="production-target"
                              type="number"
                              min="0"
                              placeholder="Enter value"
                              className={`bg-gray-50 ${touched.productionTarget && errors.productionTarget ? "border-destructive ring-destructive/20" : "border-gray-200 focus:border-blue-400 focus:ring-blue-100"}`}
                              value={productionTarget}
                              onChange={(e) =>
                                setProductionTarget(e.target.value)
                              }
                              onBlur={() => handleBlur("productionTarget")}
                            />
                            {touched.productionTarget &&
                              errors.productionTarget && (
                                <p className="text-xs text-rose-500 font-medium">
                                  {errors.productionTarget}
                                </p>
                              )}
                          </div>
                        </div>
                      </div>

                      {/* File Upload Area */}
                      <div className="space-y-2 pt-2">
                        <Label
                          htmlFor="tracker-file"
                          className="text-sm font-medium text-gray-700"
                        >
                          Project Files
                        </Label>
                        <div
                          className="group relative flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer bg-gray-50"
                          onClick={() =>
                            document.getElementById("tracker-file")?.click()
                          }
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-white shadow-sm border border-gray-200 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                              <Upload className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="text-center">
                              <p className="text-base font-semibold text-gray-800">
                                {file
                                  ? file.name
                                  : "Choose a file or drag & drop"}
                              </p>
                              <p className="text-xs text-gray-500 font-medium mt-1">
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

                      <div className="flex flex-col sm:flex-row gap-4 pt-6">
                        <Button
                          type="submit"
                          className="flex-1 h-11 font-semibold shadow-sm hover:shadow-md bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all"
                          disabled={submitting}
                        >
                          {submitting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          ) : (
                            <PlusCircle className="w-4 h-4 mr-2" />
                          )}
                          Submit Entry
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 h-11 font-semibold bg-white border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl transition-all shadow-sm"
                          onClick={handleViewAll}
                        >
                          View Recent History
                          <ChevronRight className="w-4 h-4 ml-2" />
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
