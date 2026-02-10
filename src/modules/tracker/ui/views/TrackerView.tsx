import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../../../context/AuthContext";
import { useDeviceInfo } from "@/hooks/useDeviceInfo";
import { addTrackerEntry } from "../../services/trackerService";
import TrackerTable from "../components/TrackerTable";
import type { ApiEnvelope } from "../../../dashboard/types";
import { fetchDropdownData } from "../../../dashboard/services/dashboardService";
import type { ProjectRef, TaskRef, UserRef } from "../../../dashboard/types";

interface TrackerViewErrors {
  selectedProject?: string;
  selectedTask?: string;
  baseTarget?: string;
  productionTarget?: string;
}

const TrackerView: React.FC = () => {
  const { user } = useAuth();
  const { device_id, device_type } = useDeviceInfo();
  const [projects, setProjects] = useState<ProjectRef[]>([]);
  const [tasks, setTasks] = useState<TaskRef[]>([]);
  const [viewAll, setViewAll] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [baseTarget, setBaseTarget] = useState<string | number>("");
  const [baseTargetLoading, setBaseTargetLoading] = useState(false);
  const [productionTarget, setProductionTarget] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<TrackerViewErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [entryDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  useEffect(() => {
    const fetchProjectsWithTasks = async () => {
      try {
        setLoadingProjects(true);
        const payload = {
          dropdown_type: "projects with tasks",
          logged_in_user_id: user?.user_id,
        };
        const res = await fetchDropdownData(payload);
        const projectsWithTasks: ProjectRef[] = Array.isArray(res?.data)
          ? res.data
          : [];
        setProjects(projectsWithTasks);
      } catch (error) {
        console.error(
          "[TrackerView] Error fetching projects with tasks:",
          error,
        );
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };
    if (user?.user_id) {
      fetchProjectsWithTasks();
    }
  }, [user?.user_id]);

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
    setTasks(project?.tasks || []);
    if (
      !project?.tasks?.find((t) => String(t.task_id) === String(selectedTask))
    ) {
      setSelectedTask("");
      setBaseTarget("");
    }
    setLoadingTasks(false);
  }, [selectedProject, projects, selectedTask]);

  useEffect(() => {
    if (!selectedProject || !selectedTask || !user?.user_tenure) {
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
    if (task && user.user_tenure) {
      setBaseTarget(Number(task.task_target) * Number(user.user_tenure));
    } else {
      setBaseTarget("");
    }
    setBaseTargetLoading(false);
  }, [selectedProject, selectedTask, projects, user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileObj = e.target.files?.[0];
    if (!fileObj) return;
    setFile(fileObj);
  };

  const validate = useCallback(
    (projectVal?: string, taskVal?: string): TrackerViewErrors => {
      const newErrors: TrackerViewErrors = {};
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
        isNaN(Number(productionTarget)) ||
        Number(productionTarget) < 0
      ) {
        newErrors.productionTarget = "Enter a valid number.";
      }
      return newErrors;
    },
    [selectedProject, selectedTask, baseTarget, productionTarget],
  );

  useEffect(() => {
    setErrors(validate());
  }, [validate]);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate());
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched({
      selectedProject: true,
      selectedTask: true,
      baseTarget: true,
      productionTarget: true,
    });

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
    formData.append("tenure_target", String(baseTarget));
    formData.append("logged_in_user_id", String(user?.user_id || ""));
    formData.append("device_id", device_id || "web");
    formData.append("device_type", device_type || "Laptop");

    if (file) {
      formData.append("tracker_file", file);
    }

    try {
      const res = await addTrackerEntry(formData);

      if (res?.status === 201 || res?.status === 200) {
        toast.success("Tracker added successfully!");
        setSelectedProject("");
        setSelectedTask("");
        setProductionTarget("");
        setFile(null);
        setTouched({});
      } else {
        toast.error(res?.message || "Failed to add tracker.");
      }
    } catch (err: unknown) {
      let errorMsg = "Failed to add tracker.";
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        typeof (err as { response?: unknown }).response === "object" &&
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message
      ) {
        errorMsg = (err as { response: { data: { message: string } } }).response
          .data.message;
      } else if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof (err as { message?: unknown }).message === "string"
      ) {
        errorMsg = (err as { message: string }).message;
      }
      console.error("[TrackerView] Error submitting tracker:", err);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewAll = () => setViewAll(true);
  const handleBackToForm = () => setViewAll(false);

  return (
    <>
      {viewAll ? (
        user?.user_id !== undefined ? (
          <TrackerTable
            userId={user.user_id}
            projects={projects}
            onClose={handleBackToForm}
          />
        ) : null
      ) : (
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Data Entry Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-linear-to-r from-blue-600 to-blue-700 px-8 py-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-6 h-6"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M8 12h8"></path>
                      <path d="M12 8v8"></path>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">New Production Entry</h2>
                    <p className="text-blue-100 text-sm mt-0.5">
                      Logged in as{" "}
                      <span className="font-semibold">
                        {user?.user_name || user?.name || "-"}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                  <span className="text-white text-sm font-medium">
                    Entry Date:
                  </span>
                  <span className="text-white font-semibold">{entryDate}</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <form className="p-8 space-y-8" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Project Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full h-11 bg-white border border-gray-300 rounded-lg px-4 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    onBlur={() => handleBlur("selectedProject")}
                    disabled={loadingProjects}
                    aria-invalid={!!errors.selectedProject}
                  >
                    <option value="">Select Project</option>
                    {projects.map((p) => (
                      <option key={p.project_id} value={p.project_id}>
                        {p.project_name}
                      </option>
                    ))}
                  </select>
                  {touched.selectedProject && errors.selectedProject && (
                    <span className="text-xs text-red-600">
                      {errors.selectedProject}
                    </span>
                  )}
                </div>

                {/* Task Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Task Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full h-11 bg-white border border-gray-300 rounded-lg px-4 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    value={selectedTask}
                    onChange={(e) => setSelectedTask(e.target.value)}
                    onBlur={() => handleBlur("selectedTask")}
                    disabled={!selectedProject || loadingTasks}
                    aria-invalid={!!errors.selectedTask}
                  >
                    <option value="">Select Task</option>
                    {tasks.map((t) => (
                      <option key={t.task_id} value={t.task_id}>
                        {t.task_name || t.label}
                      </option>
                    ))}
                  </select>
                  {touched.selectedTask && errors.selectedTask && (
                    <span className="text-xs text-red-600">
                      {errors.selectedTask}
                    </span>
                  )}
                </div>

                {/* Base Target (Read-only) */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Base Target <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center h-11 bg-blue-50 border border-blue-200 rounded-lg px-4 text-blue-700 font-semibold gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-blue-500"
                    >
                      <rect width="14" height="10" x="5" y="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>
                      {baseTargetLoading
                        ? "Loading..."
                        : baseTarget
                          ? baseTarget
                          : "-"}
                    </span>
                  </div>
                  {touched.baseTarget && errors.baseTarget && (
                    <span className="text-xs text-red-600">
                      {errors.baseTarget}
                    </span>
                  )}
                </div>

                {/* Production Target */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Production Target <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full h-11 bg-white border border-gray-300 rounded-lg px-4 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={productionTarget}
                    onChange={(e) => setProductionTarget(e.target.value)}
                    onBlur={() => handleBlur("productionTarget")}
                    placeholder="Enter production value"
                    aria-invalid={!!errors.productionTarget}
                  />
                  {touched.productionTarget && errors.productionTarget && (
                    <span className="text-xs text-red-600">
                      {errors.productionTarget}
                    </span>
                  )}
                </div>
              </div>

              {/* File Upload */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Project Files (Optional)
                </label>
                <div
                  className="flex items-center justify-between bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() =>
                    document.getElementById("custom-file-upload")?.click()
                  }
                >
                  <div className="flex items-center gap-3 text-gray-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-gray-400"
                    >
                      <path d="M16 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2" />
                      <rect width="8" height="8" x="14" y="2" rx="2" />
                      <path d="M8 12h4m-2-2v4" />
                    </svg>
                    <span className="font-medium">
                      {file ? file.name : "Select project files"}
                    </span>
                  </div>
                  <span className="text-blue-600 font-semibold text-sm hover:underline">
                    Browse
                  </span>
                  <input
                    id="custom-file-upload"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="md:col-span-2 flex gap-4 justify-end pt-4">
                <button
                  type="button"
                  onClick={handleViewAll}
                  className="h-11 px-8 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm transition-colors"
                >
                  View All Entries
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : "Submit Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TrackerView;
