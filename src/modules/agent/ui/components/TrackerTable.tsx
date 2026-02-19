/**
 * File: TrackerTable.tsx
 * Author: Naitik Maisuriya
 * Description: Displays all tracker entries in a table, resolves project/task names, supports file download and delete actions.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileDown,
  Filter,
  Calendar as CalendarIcon,
  FileText,
  PlusCircle,
  Briefcase,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import dayjs from "dayjs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { createTrackerColumns } from "./TrackerTableColumns";

import { deleteTracker, fetchTrackers } from "../../services/agentService";

import type { Id, TaskRef } from "../../../dashboard/types";
import type { AgentTrackerRow, TrackerTableProps } from "../../types";

const asRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split("T")[0] ?? "";
};

const TrackerTable = ({ userId, projects, onAddEntry }: TrackerTableProps) => {
  const [trackers, setTrackers] = useState<AgentTrackerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<Id | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Id | null>(null);
  const [error, setError] = useState<string>("");

  // Filter states
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(
    dayjs().startOf("month").format("YYYY-MM-DD"),
  );
  const [endDate, setEndDate] = useState<string>(
    dayjs().endOf("month").format("YYYY-MM-DD"),
  );

  // Submission window states
  const [isSubmissionWindowOpen, setIsSubmissionWindowOpen] = useState(false);
  const [nextWindowTime, setNextWindowTime] = useState("");
  const [timeRemaining, setTimeRemaining] = useState("");

  // Submission window logic
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      const isOpen = minutes < 15;
      setIsSubmissionWindowOpen(isOpen);

      if (isOpen) {
        const remainingMinutes = 14 - minutes;
        const remainingSeconds = 59 - seconds;
        setTimeRemaining(`${remainingMinutes}m ${remainingSeconds}s`);
      } else {
        const remainingMinutes = 59 - minutes;
        const remainingSeconds = 59 - seconds;
        setTimeRemaining(`${remainingMinutes}m ${remainingSeconds}s`);
      }

      const nextWindow = new Date(now);
      if (!isOpen) {
        nextWindow.setHours(now.getHours() + 1);
      }
      nextWindow.setMinutes(0);
      setNextWindowTime(
        nextWindow.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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
  const isToday = useCallback(
    (dateTime: string | null | undefined): boolean => {
      if (!dateTime) return false;
      const trackerDate = new Date(dateTime);
      const today = new Date();
      return (
        trackerDate.getFullYear() === today.getFullYear() &&
        trackerDate.getMonth() === today.getMonth() &&
        trackerDate.getDate() === today.getDate()
      );
    },
    [],
  );
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

  const handleDelete = useCallback((tracker_id: Id | undefined) => {
    if (tracker_id != null) {
      setDeleteConfirm(tracker_id);
    }
  }, []);

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

  // Define columns for the tracker table
  const columns = useMemo(
    () =>
      createTrackerColumns({
        handleDelete,
        getProjectName,
        getTaskName,
        isToday,
      }),
    [handleDelete, getProjectName, getTaskName, isToday],
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="p-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <FileText className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Tracker History
              </h2>
              <p className="text-gray-600 mt-1">
                View and manage your production entries
              </p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Conditional alert next to button */}
            {!isSubmissionWindowOpen && (
              <div className="animate-in fade-in slide-in-from-right-2 duration-500">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-full shadow-sm shrink-0">
                  <div className="flex items-center justify-center w-5 h-5 bg-rose-500 rounded-full shrink-0">
                    <AlertCircle className="h-3 w-3 text-white" />
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="text-[9px] font-black uppercase tracking-tighter text-rose-600">
                      Window Closed
                    </span>
                    <span className="text-[11px] font-bold text-rose-900 whitespace-nowrap">
                      Opens at {nextWindowTime}{" "}
                      <span className="text-[9px] font-normal opacity-60">
                        ({timeRemaining})
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}
            {isSubmissionWindowOpen && (
              <div className="animate-in fade-in slide-in-from-right-2 duration-500">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full shadow-sm shrink-0">
                  <div className="flex items-center justify-center w-5 h-5 bg-emerald-500 rounded-full shrink-0">
                    <Clock className="h-3 w-3 text-white" />
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="text-[9px] font-black uppercase tracking-tighter text-emerald-600">
                      Window Open
                    </span>
                    <span className="text-[11px] font-bold text-emerald-900 whitespace-nowrap">
                      Ends in {timeRemaining}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              {onAddEntry && (
                <Button
                  onClick={onAddEntry}
                  disabled={!isSubmissionWindowOpen}
                  className={` px-6 shadow-md transition-all ${
                    isSubmissionWindowOpen
                      ? "bg-blue-600 hover:bg-blue-700 shadow-blue-100"
                      : "bg-slate-200 text-slate-400 shadow-none cursor-not-allowed border-slate-300"
                  }`}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Entry
                </Button>
              )}
              <Button
                onClick={handleExportToExcel}
                disabled={loading || trackers.length === 0}
                variant="outline"
                className=" px-6 border-gray-300 bg-green-50 text-green-700 hover:bg-green-100"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Totals Summary */}
      {!loading && trackers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500 delay-150">
          <Card className="border-blue-100 bg-blue-50/30 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
              <CalendarIcon className="w-12 h-12 text-blue-900" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-blue-600 font-bold uppercase tracking-widest text-[10px]">
                Avg Hourly Target
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-blue-900">
                {totals.tenureTarget.toFixed(1)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-emerald-100 bg-emerald-50/30 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
              <PlusCircle className="w-12 h-12 text-emerald-900" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-emerald-600 font-bold uppercase tracking-widest text-[10px]">
                Total Production
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-emerald-900">
                {totals.production.toFixed(0)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-slate-100 bg-slate-50/50 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
              <Briefcase className="w-12 h-12 text-slate-900" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">
                Total Billable Hours
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-slate-900">
                {totals.billableHours.toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filter Section */}
      <div className="bg-white rounded shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Filter className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Filter Options
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className=" border-gray-300"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className=" border-gray-300"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Project
            </label>
            <Select
              value={selectedProject}
              onValueChange={(val) => {
                setSelectedProject(val);
                setSelectedTask("");
              }}
            >
              <SelectTrigger className=" border-gray-300 w-full">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.project_id} value={String(p.project_id)}>
                    {p.project_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Task
            </label>
            <Select
              value={selectedTask}
              onValueChange={(val) => setSelectedTask(val)}
              disabled={!selectedProject || selectedProject === "all"}
            >
              <SelectTrigger className="w-full border-gray-300">
                <SelectValue placeholder="All Tasks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                {availableTasks.map((t) => (
                  <SelectItem key={t.task_id} value={String(t.task_id)}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
          <Button
            onClick={handleClearFilters}
            variant="outline"
            className=" px-6 border-gray-300"
          >
            Clear All Filters
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={trackers}
        loading={loading}
        emptyMessage="No tracker entries found for this period"
        emptyIcon={FileText}
        showPagination={true}
        pageSize={10}
        containerClassName="bg-white rounded shadow-sm border border-gray-200 overflow-hidden"
        headerClassName="bg-gray-50 border-b border-gray-200"
        rowClassName="border-gray-100 group"
        rowHoverClassName="hover:bg-blue-50/50 transition-colors"
      />

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <DialogContent className="max-w-100">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this production entry? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              disabled={deletingId != null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirmDelete()}
              disabled={deletingId != null}
              className="gap-2"
            >
              {deletingId != null && (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Delete Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrackerTable;
