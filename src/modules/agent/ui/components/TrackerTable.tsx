/**
 * File: TrackerTable.tsx
 * Author: Naitik Maisuriya
 * Description: Displays all tracker entries in a table, resolves project/task names, supports file download and delete actions.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Download, FileDown, Filter, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";

import { deleteTracker, fetchTrackers } from "../../services/agentService";
import { useAuth } from "../../../../context/AuthContext";

import type { Id, TaskRef, TrackerRow } from "../../../dashboard/types";
import type { AgentProjectWithTasks, AgentTrackerRow } from "../../types";

export interface TrackerTableProps {
  userId: Id | null | undefined;
  projects: AgentProjectWithTasks[];
  onClose: () => void;
}

const asRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split("T")[0] ?? "";
};

const TrackerTable = ({ userId, projects, onClose }: TrackerTableProps) => {
  const { user } = useAuth();

  const [trackers, setTrackers] = useState<AgentTrackerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<Id | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Id | null>(null);
  const [error, setError] = useState<string>("");

  // Filter states
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(getTodayDate());
  const [endDate, setEndDate] = useState<string>(getTodayDate());

  // Get tasks for selected project
  const availableTasks = useMemo<TaskRef[]>(() => {
    if (!selectedProject) return [];
    const project = projects.find(
      (p) => String(p.project_id) === String(selectedProject),
    );
    return project?.tasks ?? [];
  }, [selectedProject, projects]);

  // Lookup helpers (use new projects-with-tasks structure)
  const getProjectName = useCallback(
    (id: Id | undefined): string => {
      const project = projects.find((p) => String(p.project_id) === String(id));
      return project?.project_name || "-";
    },
    [projects],
  );

  const getTaskName = useCallback(
    (task_id: Id | undefined, project_id: Id | undefined): string => {
      const project = projects.find(
        (p) => String(p.project_id) === String(project_id),
      );

      const task = project?.tasks?.find(
        (t) => String(t.task_id) === String(task_id),
      );

      return task?.label ?? task?.task_name ?? "-";
    },
    [projects],
  );

  // Check if tracker entry is from today
  const isToday = (dateTime: string | undefined): boolean => {
    if (!dateTime) return false;
    const trackerDate = new Date(dateTime);
    const today = new Date();
    return (
      trackerDate.getFullYear() === today.getFullYear() &&
      trackerDate.getMonth() === today.getMonth() &&
      trackerDate.getDate() === today.getDate()
    );
  };
  // Fetch tracker data with filters
  useEffect(() => {
    if (userId == null) {
      return;
    }

    const loadTrackers = async (): Promise<void> => {
      try {
        setLoading(true);
        setError("");

        // Build payload: send the correct agent's userId
        const payload = { logged_in_user_id: userId };

        const res: unknown = await fetchTrackers(payload);

        const okStatus = asRecord(res) && res.status === 200;
        const responseData =
          okStatus && asRecord(res.data) ? res.data.data : undefined;

        const fetched =
          asRecord(responseData) && Array.isArray(responseData.trackers)
            ? (responseData.trackers as AgentTrackerRow[])
            : [];

        const enriched = fetched
          .filter((tracker) => {
            if (!tracker.date_time) return true;

            const trackerDate =
              new Date(tracker.date_time).toISOString().split("T")[0] ?? "";

            if (startDate && trackerDate < startDate) return false;
            if (endDate && trackerDate > endDate) return false;
            if (
              selectedProject &&
              String(tracker.project_id) !== String(selectedProject)
            )
              return false;
            if (
              selectedTask &&
              String(tracker.task_id) !== String(selectedTask)
            )
              return false;

            return true;
          })
          .map((tracker) => ({
            ...tracker,
            project_name:
              tracker.project_name || getProjectName(tracker.project_id),
            task_name:
              tracker.task_name ||
              getTaskName(tracker.task_id, tracker.project_id),
          }));

        setTrackers(enriched);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : asRecord(err) && typeof err.message === "string"
              ? err.message
              : "Unknown error";

        const errorMsg = `Failed to fetch tracker data: ${msg}`;
        console.error("[TrackerTable] Error fetching trackers:", err);
        setError(errorMsg);
        setTrackers([]);
      } finally {
        setLoading(false);
      }
    };

    void loadTrackers();
  }, [
    userId,
    startDate,
    endDate,
    selectedProject,
    selectedTask,
    getProjectName,
    getTaskName,
  ]);

  // Debug: Log tracker data for different roles
  useEffect(() => {
    if (!trackers || !user) return;
    const roleRaw = user?.role_name || user?.user_role || user?.role || "";
    const role = String(roleRaw).toLowerCase();
    const userId = user?.user_id || user?.id || "-";
    // Debug: log user object and role values
    console.log("[TrackerTable Debug] user:", user);
    console.log(
      "[TrackerTable Debug] roleRaw:",
      roleRaw,
      "| role:",
      role,
      "| userId:",
      userId,
    );
    if (role.includes("qa")) {
      console.log(
        `[QA Agent][user_id: ${userId}][role: ${roleRaw}] TrackerTable data:`,
        trackers,
      );
    } else if (role.includes("assistant manager") || role.includes("asst")) {
      console.log(
        `[Assistant Manager][user_id: ${userId}][role: ${roleRaw}] TrackerTable data:`,
        trackers,
      );
    } else if (
      (role.includes("agent") && !role.includes("qa")) ||
      Number(user?.role_id) === 6
    ) {
      console.log(
        `[Agent][user_id: ${userId}][role: ${roleRaw}] TrackerTable data:`,
        trackers,
      );
    } else {
      console.log(
        `[Other Role][user_id: ${userId}][role: ${roleRaw}] TrackerTable data:`,
        trackers,
      );
    }
  }, [trackers, user]);

  const handleDelete = (tracker_id: Id | undefined) => {
    if (tracker_id != null) {
      setDeleteConfirm(tracker_id);
    }
  };

  const confirmDelete = async (): Promise<void> => {
    if (deleteConfirm == null) return;

    try {
      setDeletingId(deleteConfirm);
      setError("");

      await deleteTracker({ tracker_id: deleteConfirm });

      setTrackers((prev) =>
        prev.filter((t) => String(t.tracker_id) !== String(deleteConfirm)),
      );
      setDeleteConfirm(null);
      toast.success("Tracker deleted successfully!");
    } catch (err: unknown) {
      console.error("[TrackerTable] Delete error:", err);
      setError("Delete failed. Please try again.");
      toast.error("Failed to delete tracker.");
    } finally {
      setDeletingId(null);
    }
  };

  // Clear filters
  const handleClearFilters = (): void => {
    setSelectedProject("");
    setSelectedTask("");
    setStartDate(getTodayDate());
    setEndDate(getTodayDate());
  };

  // Calculate totals from filtered trackers
  // Always use tenure_target from tracker/view for all roles
  type Totals = {
    tenureTarget: number;
    production: number;
    billableHours: number;
  };

  const totals = useMemo<Totals>(() => {
    return trackers.reduce<Totals>(
      (acc, tracker) => {
        const perHourTarget = Number(tracker.tenure_target ?? 0) || 0;
        acc.tenureTarget += perHourTarget;
        acc.production += Number(tracker.production ?? 0) || 0;
        acc.billableHours += Number(tracker.billable_hours ?? 0) || 0;
        return acc;
      },
      { tenureTarget: 0, production: 0, billableHours: 0 },
    );
  }, [trackers]);

  // Export to Excel function
  const handleExportToExcel = (): void => {
    if (trackers.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      type ExportRow = {
        "Date/Time": string;
        Project: string;
        Task: string;
        "Per Hour Target": string | number;
        Production: string | number;
        "Billable Hours": string;
        "Has File": string;
      };

      const exportData: ExportRow[] = trackers.map((tracker) => ({
        "Date/Time": tracker.date_time
          ? format(new Date(tracker.date_time), "M/d/yyyy h:mm a")
          : "-",
        Project: tracker.project_name || getProjectName(tracker.project_id),
        Task: tracker.task_name || "-",
        "Per Hour Target": tracker.tenure_target ?? 0,
        Production: tracker.production ?? 0,
        "Billable Hours":
          tracker.billable_hours !== null &&
          tracker.billable_hours !== undefined
            ? Number(tracker.billable_hours).toFixed(2)
            : "0.00",
        "Has File": tracker.tracker_file ? "Yes" : "No",
      }));

      // Add totals row
      exportData.push({
        "Date/Time": "",
        Project: "",
        Task: "TOTAL",
        "Per Hour Target": totals.tenureTarget.toFixed(2),
        Production: totals.production.toFixed(2),
        "Billable Hours": totals.billableHours.toFixed(2),
        "Has File": "",
      });

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      worksheet["!cols"] = [
        { wch: 18 }, // Date/Time
        { wch: 20 }, // Project
        { wch: 25 }, // Task
        { wch: 15 }, // Tenure Target
        { wch: 12 }, // Production
        { wch: 15 }, // Billable Hours
        { wch: 10 }, // Has File
      ];

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Trackers");

      // Generate filename with date range
      const filename = `Trackers_${startDate}_to_${endDate}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      toast.success(`Exported ${trackers.length} records successfully!`);
    } catch (err: unknown) {
      console.error("[TrackerTable] Excel export error:", err);
      toast.error("Failed to export data");
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-5">
      <div className="mb-8 flex items-center gap-3 justify-between">
        <h2 className="text-3xl font-extrabold text-blue-800 tracking-tight drop-shadow-sm">
          All Trackers
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleExportToExcel}
            disabled={loading || trackers.length === 0}
            className="bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
            title="Export filtered data to Excel"
          >
            <FileDown className="w-4 h-4" />
            Export to Excel
          </button>
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-xs shadow transition-all"
          >
            Back to Form
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-linear-to-br from-blue-50 via-white to-indigo-50 rounded-2xl p-6 mb-6 shadow border border-blue-100">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-blue-700" />
          <h3 className="text-base font-bold text-blue-700 tracking-wide">
            Filters
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-blue-900 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm transition-all"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-blue-900 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm transition-all"
            />
          </div>

          {/* Project Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-blue-900 mb-1">
              Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                setSelectedTask(""); // Clear task when project changes
              }}
              className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm transition-all"
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
            <label className="block text-xs font-semibold text-blue-900 mb-1">
              Task
            </label>
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              disabled={!selectedProject}
              className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            >
              <option value="">All Tasks</option>
              {availableTasks.map((task) => (
                <option key={task.task_id} value={task.task_id}>
                  {task.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="mt-2.5 flex justify-end">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold shadow transition-all"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {error && <div className="text-red-600 mb-2">{error}</div>}

      {/* Scrollable table container with max height for 10 rows */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto border border-slate-200 rounded-2xl shadow-lg bg-white">
        <table className="min-w-full text-sm text-slate-700 table-fixed rounded-xl overflow-hidden">
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
          <thead className="bg-linear-to-r from-blue-100 to-blue-50 sticky top-0 z-10">
            <tr>
              <th className="px-5 py-3 font-bold text-blue-800 uppercase tracking-wider border-b border-slate-200 text-left">
                Date/Time
              </th>
              <th className="px-5 py-3 font-bold text-blue-800 uppercase tracking-wider border-b border-slate-200 text-left">
                Project
              </th>
              <th className="px-5 py-3 font-bold text-blue-800 uppercase tracking-wider border-b border-slate-200 text-left">
                Task
              </th>
              <th className="px-5 py-3 font-bold text-blue-800 uppercase tracking-wider border-b border-slate-200 text-left">
                Per Hour Target
              </th>
              <th className="px-5 py-3 font-bold text-blue-800 uppercase tracking-wider border-b border-slate-200 text-left">
                Production
              </th>
              <th className="px-5 py-3 font-bold text-blue-800 uppercase tracking-wider border-b border-slate-200 text-left">
                Billable Hours
              </th>
              <th className="px-5 py-3 font-bold text-blue-800 uppercase tracking-wider border-b border-slate-200 text-left">
                Task File
              </th>
              <th className="px-5 py-3 font-bold text-blue-800 uppercase tracking-wider border-b border-slate-200 text-center">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-16 font-semibold text-blue-600 animate-pulse"
                >
                  Loading...
                </td>
              </tr>
            ) : trackers.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-16 text-slate-400 font-medium"
                >
                  No tracker data found.
                </td>
              </tr>
            ) : (
              trackers.map((tracker) => (
                <tr
                  key={tracker.tracker_id}
                  className="border-b border-slate-100 hover:bg-blue-50/60 transition-colors group"
                >
                  <td className="px-5 py-3 align-middle whitespace-nowrap">
                    {tracker.date_time
                      ? format(new Date(tracker.date_time), "dd/MM/yyyy")
                      : "-"}
                  </td>
                  <td className="px-5 py-3 align-middle whitespace-nowrap">
                    {tracker.project_name || getProjectName(tracker.project_id)}
                  </td>
                  <td className="px-5 py-3 align-middle whitespace-nowrap">
                    {tracker.task_name ||
                      getTaskName(tracker.task_id, tracker.project_id) ||
                      "-"}
                  </td>
                  {/* Always show tenure_target from tracker/view for all roles */}
                  <td className="px-5 py-3 align-middle whitespace-nowrap">
                    {tracker.tenure_target ?? "-"}
                  </td>
                  <td className="px-5 py-3 align-middle whitespace-nowrap">
                    {tracker.production}
                  </td>
                  <td className="px-5 py-3 align-middle whitespace-nowrap">
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
                        className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 group-hover:bg-blue-100 rounded-full p-2 shadow-sm"
                        title="Download file"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 align-middle text-center">
                    {isToday(tracker.date_time) ? (
                      <button
                        onClick={() => handleDelete(tracker.tracker_id)}
                        disabled={deletingId === tracker.tracker_id}
                        className="p-0 bg-transparent hover:bg-transparent focus:outline-none"
                        title="Delete Tracker"
                        aria-label="Delete Tracker"
                      >
                        <Trash2 className="w-6 h-6 text-red-500 bg-red-100 bg-opacity-40 rounded-full p-1 transition-colors duration-200 hover:text-white hover:bg-red-500 hover:bg-opacity-100" />
                      </button>
                    ) : (
                      <span
                        className="text-slate-300"
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
        <div className="mt-6 bg-linear-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-lg">
          <h3 className="text-lg font-bold text-blue-900 mb-6 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
            Summary Totals
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Per Hour Target */}
            <div className="bg-white rounded-xl p-6 shadow border border-blue-100 flex flex-col items-center">
              <p className="text-xs text-gray-600 mb-1 uppercase tracking-wide">
                Total Per Hour Target
              </p>
              <p className="text-3xl font-extrabold text-blue-700">
                {totals.tenureTarget.toFixed(2)}
              </p>
            </div>

            {/* Total Production */}
            <div className="bg-white rounded-xl p-6 shadow border border-green-100 flex flex-col items-center">
              <p className="text-xs text-gray-600 mb-1 uppercase tracking-wide">
                Total Production
              </p>
              <p className="text-3xl font-extrabold text-green-700">
                {totals.production.toFixed(2)}
              </p>
            </div>

            {/* Total Billable Hours */}
            <div className="bg-white rounded-xl p-6 shadow border border-purple-100 flex flex-col items-center">
              <p className="text-xs text-gray-600 mb-1 uppercase tracking-wide">
                Total Billable Hours
              </p>
              <p className="text-3xl font-extrabold text-purple-700">
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
                disabled={deletingId != null}
              >
                Cancel
              </button>
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold"
                onClick={() => void confirmDelete()}
                disabled={deletingId != null}
              >
                {deletingId != null ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackerTable;
