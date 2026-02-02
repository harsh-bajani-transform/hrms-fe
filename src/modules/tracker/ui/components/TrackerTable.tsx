import React, { useEffect, useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { Download, Trash2, Filter, FileDown } from "lucide-react";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import { useAuth } from "../../../../context/AuthContext";
import {
  fetchTrackers,
  deleteTrackerEntry,
} from "../../services/trackerService";
import type {
  ProjectRef,
  TaskRef,
  TrackerRow,
  ApiEnvelope,
} from "../../../dashboard/types";

interface TrackerTableProps {
  userId?: string | number;
  projects: ProjectRef[];
  onClose: () => void;
}

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

const TrackerTable: React.FC<TrackerTableProps> = ({
  userId,
  projects,
  onClose,
}) => {
  const { user } = useAuth();
  const [trackers, setTrackers] = useState<TrackerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | number | null>(
    null,
  );
  const [error, setError] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [startDate, setStartDate] = useState(""); // empty by default
  const [endDate, setEndDate] = useState(""); // empty by default

  const availableTasks = useMemo(() => {
    if (!selectedProject) return [];
    const project = projects.find(
      (p) => String(p.project_id) === String(selectedProject),
    );
    return project?.tasks || [];
  }, [selectedProject, projects]);

  const getProjectName = useCallback(
    (id: string | number | undefined, tracker: TrackerRow) => {
      if (tracker?.project_name) return tracker.project_name;
      const project = projects.find((p) => String(p.project_id) === String(id));
      return project?.project_name || "-";
    },
    [projects],
  );

  const getTaskName = useCallback(
    (
      task_id: string | number | undefined,
      project_id: string | number | undefined,
      tracker: TrackerRow,
    ) => {
      if (tracker?.task_name) return tracker.task_name;
      const project = projects.find(
        (p) => String(p.project_id) === String(project_id),
      );
      const task = project?.tasks?.find(
        (t) => String(t.task_id) === String(task_id),
      );
      return task?.label || task?.task_name || "-";
    },
    [projects],
  );

  const isToday = (dateTime?: string) => {
    if (!dateTime) return false;
    const trackerDate = new Date(dateTime);
    const today = new Date();
    return (
      trackerDate.getFullYear() === today.getFullYear() &&
      trackerDate.getMonth() === today.getMonth() &&
      trackerDate.getDate() === today.getDate()
    );
  };

  useEffect(() => {
    if (!userId) return;
    const loadTrackers = async () => {
      try {
        setLoading(true);
        setError("");
        const device_id =
          typeof user?.device_id === "string" ? user.device_id : "adjisjd09734";
        const device_type =
          typeof user?.device_type === "string" ? user.device_type : "LAPTOP";
        const payload: Record<string, unknown> = {
          logged_in_user_id: user?.user_id,
          user_id: userId,
          device_id,
          device_type,
        };
        if (selectedProject) payload.project_id = Number(selectedProject);
        if (selectedTask) payload.task_id = Number(selectedTask);
        const res = (await fetchTrackers(payload)) as ApiEnvelope<{
          tracker?: TrackerRow[];
          tasks?: TaskRef[];
        }>;
        if (
          res &&
          typeof res === "object" &&
          "status" in res &&
          res.status === 200 &&
          "data" in res &&
          res.data
        ) {
          const responseData = res.data;
          const fetchedTrackers: TrackerRow[] = Array.isArray(
            responseData.tracker,
          )
            ? responseData.tracker
            : [];
          const tasks: TaskRef[] = Array.isArray(responseData.tasks)
            ? responseData.tasks
            : [];
          const taskMap: Record<
            string,
            { task_name?: string; task_target?: string | number }
          > = {};
          tasks.forEach((task) => {
            if (task.task_id !== undefined) {
              taskMap[String(task.task_id)] = {
                task_name: task.task_name ?? "",
                task_target: task.task_target ?? "",
              };
            }
          });
          const enrichedTrackers = fetchedTrackers
            .filter((tracker) => {
              if (!tracker.date_time) return true;
              const trackerDate = tracker.date_time
                ? new Date(tracker.date_time).toISOString().split("T")[0]
                : undefined;
              if (startDate && trackerDate && trackerDate < startDate)
                return false;
              if (endDate && trackerDate && trackerDate > endDate) return false;
              return true;
            })
            .map((tracker) => {
              const taskInfo =
                tracker.task_id !== undefined
                  ? taskMap[String(tracker.task_id)]
                  : {};
              return {
                ...tracker,
                task_name: tracker.task_name || taskInfo?.task_name || "-",
              };
            });
          setTrackers(enrichedTrackers);
        } else {
          setTrackers([]);
        }
      } catch (err: unknown) {
        let msg = "Unknown error";
        if (
          err &&
          typeof err === "object" &&
          "response" in err &&
          typeof (err as { response?: unknown }).response === "object" &&
          (err as { response?: { data?: { message?: string } } }).response?.data
            ?.message
        ) {
          msg = (err as { response: { data: { message: string } } }).response
            .data.message;
        } else if (
          err &&
          typeof err === "object" &&
          "message" in err &&
          typeof (err as { message?: unknown }).message === "string"
        ) {
          msg = (err as { message: string }).message;
        }
        const errorMsg = "Failed to fetch tracker data: " + msg;
        console.error("[TrackerTable] Error fetching trackers:", errorMsg);
        setError(errorMsg);
        setTrackers([]);
      } finally {
        setLoading(false);
      }
    };
    loadTrackers();
  }, [
    userId,
    user?.user_id,
    user?.device_id,
    user?.device_type,
    startDate,
    endDate,
    selectedProject,
    selectedTask,
    projects,
  ]);

  const handleDelete = (tracker_id: string | number) =>
    setDeleteConfirm(tracker_id);

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setDeletingId(deleteConfirm);
      setError("");
      await deleteTrackerEntry(Number(deleteConfirm));
      setTrackers(trackers.filter((t) => t.tracker_id !== deleteConfirm));
      setDeleteConfirm(null);
      toast.success("Tracker deleted successfully!");
    } catch (err: unknown) {
      const errorMsg = "Delete failed. Please try again.";
      console.error("[TrackerTable] Delete error:", err);
      setError(errorMsg);
      toast.error("Failed to delete tracker.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearFilters = () => {
    setSelectedProject("");
    setSelectedTask("");
    setStartDate("");
    setEndDate("");
  };

  const totals = useMemo(() => {
    return trackers.reduce<{
      tenureTarget: number;
      production: number;
      billableHours: number;
    }>(
      (acc, tracker) => {
        acc.tenureTarget += Number(tracker.tenure_target) || 0;
        acc.production += Number(tracker.production) || 0;
        acc.billableHours += Number(tracker.billable_hours) || 0;
        return acc;
      },
      { tenureTarget: 0, production: 0, billableHours: 0 },
    );
  }, [trackers]);

  const handleExportToExcel = () => {
    if (trackers.length === 0) {
      toast.error("No data to export");
      return;
    }
    try {
      const exportData = trackers.map((tracker) => {
        const projectId =
          typeof tracker.project_id === "string" ||
          typeof tracker.project_id === "number"
            ? tracker.project_id
            : undefined;
        const taskId =
          typeof tracker.task_id === "string" ||
          typeof tracker.task_id === "number"
            ? tracker.task_id
            : undefined;
        return {
          "Date/Time": tracker.date_time
            ? format(new Date(tracker.date_time), "M/d/yyyy h:mm a")
            : "-",
          Project: getProjectName(projectId, tracker),
          Task: getTaskName(taskId, projectId, tracker),
          "Per Hour Target": tracker.tenure_target || 0,
          Production: tracker.production || 0,
          "Billable Hours":
            tracker.billable_hours !== null &&
            tracker.billable_hours !== undefined
              ? Number(tracker.billable_hours).toFixed(2)
              : "0.00",
          "Has File": tracker.tracker_file ? "Yes" : "No",
        };
      });
      exportData.push({
        "Date/Time": "",
        Project: "",
        Task: "TOTAL",
        "Per Hour Target": totals.tenureTarget.toFixed(2),
        Production: totals.production.toFixed(2),
        "Billable Hours": totals.billableHours.toFixed(2),
        "Has File": "",
      });
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet["!cols"] = [
        { wch: 18 },
        { wch: 20 },
        { wch: 25 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 10 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Trackers");
      const filename = `Trackers_${startDate}_to_${endDate}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success(`Exported ${trackers.length} records successfully!`);
    } catch (err) {
      console.error("[TrackerTable] Excel export error:", err);
      toast.error("Failed to export data");
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-700">All Trackers</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExportToExcel}
            disabled={loading || trackers.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            title="Export filtered data to Excel"
          >
            <FileDown className="w-4 h-4" />
            Export to Excel
          </button>
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm"
          >
            Back to Form
          </button>
        </div>
      </div>
      {/* Filter Section */}
      <div className="bg-blue-50 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Filter className="w-4 h-4 text-blue-700" />
          <h3 className="text-base font-semibold text-blue-700">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Start Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {/* End Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {/* Project Dropdown */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                setSelectedTask("");
              }}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.project_id} value={project.project_id}>
                  {project.project_name}
                </option>
              ))}
            </select>
          </div>
          {/* Task Dropdown */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Task
            </label>
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              disabled={!selectedProject}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">All Tasks</option>
              {availableTasks.map((task) => (
                <option key={task.task_id} value={task.task_id}>
                  {task.label || task.task_name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Clear Filters Button */}
        <div className="mt-2.5 flex justify-end">
          <button
            onClick={handleClearFilters}
            className="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium transition"
          >
            Clear Filters
          </button>
        </div>
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {/* Scrollable table container with max height for 10 rows */}
      <div className="overflow-x-auto max-h-85 overflow-y-auto border border-slate-200 rounded-lg">
        <table className="min-w-full text-sm text-slate-700 table-fixed">
          <colgroup>
            <col style={{ width: "16%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "7%" }} />
          </colgroup>
          <thead className="bg-blue-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 font-semibold text-left">Date/Time</th>
              <th className="px-4 py-3 font-semibold text-left">Project</th>
              <th className="px-4 py-3 font-semibold text-left">Task</th>
              <th className="px-4 py-3 font-semibold text-left">
                Per Hour Target
              </th>
              <th className="px-4 py-3 font-semibold text-left">Production</th>
              <th className="px-4 py-3 font-semibold text-left">
                Billable Hours
              </th>
              <th className="px-4 py-3 font-semibold text-left">Task File</th>
              <th className="px-4 py-3 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-8">
                  Loading...
                </td>
              </tr>
            ) : trackers.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8">
                  No tracker data found.
                </td>
              </tr>
            ) : (
              trackers.map((tracker) => (
                <tr
                  key={tracker.tracker_id}
                  className="border-b border-slate-100 hover:bg-blue-50 transition"
                >
                  <td className="px-4 py-2 align-middle">
                    {tracker.date_time
                      ? (() => {
                          const d = new Date(tracker.date_time);
                          const pad = (n) => n.toString().padStart(2, "0");
                          return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
                        })()
                      : "-"}
                  </td>
                  <td className="px-4 py-2 align-middle">
                    {getProjectName(
                      typeof tracker.project_id === "string" ||
                        typeof tracker.project_id === "number"
                        ? tracker.project_id
                        : undefined,
                      tracker,
                    )}
                  </td>
                  <td className="px-4 py-2 align-middle">
                    {getTaskName(
                      typeof tracker.task_id === "string" ||
                        typeof tracker.task_id === "number"
                        ? tracker.task_id
                        : undefined,
                      typeof tracker.project_id === "string" ||
                        typeof tracker.project_id === "number"
                        ? tracker.project_id
                        : undefined,
                      tracker,
                    )}
                  </td>
                  <td className="px-4 py-2 align-middle">
                    {tracker.tenure_target || "-"}
                  </td>
                  <td className="px-4 py-2 align-middle">
                    {tracker.production}
                  </td>
                  <td className="px-4 py-2 align-middle">
                    {tracker.billable_hours !== null &&
                    tracker.billable_hours !== undefined
                      ? Number(tracker.billable_hours).toFixed(2)
                      : "0.00"}
                  </td>
                  <td className="px-4 py-2 align-middle text-center">
                    {tracker.tracker_file ? (
                      <a
                        href={tracker.tracker_file}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800"
                        title="Download file"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 align-middle text-center">
                    {isToday(tracker.date_time) ? (
                      <button
                        onClick={() => handleDelete(tracker.tracker_id!)}
                        disabled={deletingId === tracker.tracker_id}
                        className="p-0 bg-transparent hover:bg-transparent focus:outline-none"
                        title="Delete Tracker"
                        aria-label="Delete Tracker"
                      >
                        <Trash2 className="w-6 h-6 text-red-500 bg-red-100 bg-opacity-40 rounded-full p-1 transition-colors duration-200 hover:text-white hover:bg-red-500 hover:bg-opacity-100" />
                      </button>
                    ) : (
                      <span
                        className="text-slate-400"
                        title="Can only delete today's entries"
                      >
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Totals Summary Card */}
      {!loading && trackers.length > 0 && (
        <div className="mt-4 bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
            Summary Totals
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Per Hour Target */}
            <div className="bg-white rounded-lg p-3 shadow-sm border border-blue-100">
              <p className="text-xs text-gray-600 mb-1">
                Total Per Hour Target
              </p>
              <p className="text-2xl font-bold text-blue-700">
                {totals.tenureTarget.toFixed(2)}
              </p>
            </div>
            {/* Total Production */}
            <div className="bg-white rounded-lg p-3 shadow-sm border border-blue-100">
              <p className="text-xs text-gray-600 mb-1">Total Production</p>
              <p className="text-2xl font-bold text-green-700">
                {totals.production.toFixed(2)}
              </p>
            </div>
            {/* Total Billable Hours */}
            <div className="bg-white rounded-lg p-3 shadow-sm border border-blue-100">
              <p className="text-xs text-gray-600 mb-1">Total Billable Hours</p>
              <p className="text-2xl font-bold text-purple-700">
                {totals.billableHours.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full pointer-events-auto">
            <h3 className="text-lg font-bold mb-4 text-slate-800">
              Confirm Delete
            </h3>
            <p className="mb-6 text-slate-600">
              Are you sure you want to delete this tracker entry?
            </p>
            <div className="flex justify-end gap-4">
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded font-semibold"
                onClick={() => setDeleteConfirm(null)}
                disabled={deletingId !== null}
              >
                Cancel
              </button>
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold"
                onClick={confirmDelete}
                disabled={deletingId !== null}
              >
                {deletingId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackerTable;
