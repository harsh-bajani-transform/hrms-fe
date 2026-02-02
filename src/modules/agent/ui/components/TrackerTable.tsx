/**
 * File: TrackerTable.tsx
 * Author: Naitik Maisuriya
 * Description: Displays all tracker entries in a table, resolves project/task names, supports file download and delete actions.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Download,
  FileDown,
  Filter,
  Trash2,
  Calendar as CalendarIcon,
  ArrowLeft,
  MoreHorizontal,
  FileText,
  PlusCircle,
  Briefcase,
} from "lucide-react";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

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
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            Production History
          </h2>
          <p className="text-slate-500">
            Track and manage your daily production entries and targets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold gap-2 h-10 shadow-sm"
            onClick={handleExportToExcel}
            disabled={loading || trackers.length === 0}
          >
            <FileDown className="w-4 h-4 text-emerald-600" />
            Export Excel
          </Button>
          <Button
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 font-bold gap-2 h-10 shadow-md text-white border-none"
            onClick={onClose}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Entry
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-slate-50/50">
        <CardHeader className="pb-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Search Filters
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 bg-white border-slate-200 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 bg-white border-slate-200 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">
                Project
              </label>
              <Select
                value={selectedProject}
                onValueChange={(val) => {
                  setSelectedProject(val);
                  setSelectedTask("");
                }}
              >
                <SelectTrigger className="h-10 w-full bg-white border-slate-200">
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
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">
                Task
              </label>
              <Select
                value={selectedTask}
                onValueChange={(val) => setSelectedTask(val)}
                disabled={!selectedProject || selectedProject === "all"}
              >
                <SelectTrigger className="h-10 w-full bg-white border-slate-200">
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
          <div className="mt-6 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-slate-900 font-bold"
              onClick={handleClearFilters}
            >
              Clear All Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Badge
          variant="destructive"
          className="w-full flex justify-center py-2 rounded-lg text-sm font-medium"
        >
          {error}
        </Badge>
      )}

      {/* Main Table */}
      <Card className="border-slate-200 shadow-xl overflow-hidden min-h-[400px]">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[120px] font-bold text-slate-900 h-12">
                Date
              </TableHead>
              <TableHead className="font-bold text-slate-900 h-12">
                Project
              </TableHead>
              <TableHead className="font-bold text-slate-900 h-12">
                Task
              </TableHead>
              <TableHead className="text-center font-bold text-slate-900 h-12">
                Per Hour Target
              </TableHead>
              <TableHead className="text-center font-bold text-slate-900 h-12">
                Production
              </TableHead>
              <TableHead className="text-center font-bold text-slate-900 h-12">
                Billable Hours
              </TableHead>
              <TableHead className="text-center font-bold text-slate-900 h-12">
                File
              </TableHead>
              <TableHead className="text-right pr-6 font-bold text-slate-900 h-12">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium">
                      Fetching records...
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : trackers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 text-slate-300">
                    <FileText className="w-12 h-12 opacity-20" />
                    <p className="text-slate-400 font-medium">
                      No tracker entries found for this period.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              trackers.map((tracker) => (
                <TableRow
                  key={tracker.tracker_id}
                  className="group hover:bg-slate-50/80 transition-colors border-slate-100"
                >
                  <TableCell className="font-medium text-slate-600">
                    {tracker.date_time
                      ? format(new Date(tracker.date_time), "dd/MM/yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500/50" />
                      <span className="font-semibold text-slate-900">
                        {tracker.project_name ||
                          getProjectName(tracker.project_id)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 min-w-[150px]">
                    {tracker.task_name ||
                      getTaskName(tracker.task_id, tracker.project_id)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className="font-bold border-slate-200 bg-slate-50 text-slate-700"
                    >
                      {tracker.tenure_target ?? "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-blue-50! text-blue-700! border-blue-100! font-bold">
                      {tracker.production}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-bold text-slate-700">
                    {tracker.billable_hours != null
                      ? Number(tracker.billable_hours).toFixed(2)
                      : "0.00"}
                  </TableCell>
                  <TableCell className="text-center">
                    {tracker.tracker_file ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full hover:bg-blue-50 text-blue-600"
                        asChild
                      >
                        <a
                          href={tracker.tracker_file}
                          download
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    {isToday(tracker.date_time) ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full hover:bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(tracker.tracker_id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

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

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <DialogContent className="max-w-[400px]">
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
