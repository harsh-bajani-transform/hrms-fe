import React, { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "../../../../context/AuthContext";
import { getTodayDate } from "../../../../lib/utils/dateUtils";
import { exportToExcel } from "../../../../lib/utils/excelUtils";
import {
  fetchDashboardData,
  fetchDropdownData,
} from "../../../dashboard/services/dashboardService";
import type {
  TrackerRow,
  UserRef,
  ProjectRef,
  TaskRef,
  DashboardFilterPayload,
} from "../../../dashboard/types";
import { createColumns } from "./QATrackerReportViewColumns";
import { TrackerEditModal } from "./TrackerEditModal";
import { deleteTrackerEntry } from "../../../tracker/services/trackerService";
import QATrackerReportHeader from "../components/QATrackerReportHeader";
import QATrackerReportFilters from "../components/QATrackerReportFilters";
import QATrackerReportSummary from "../components/QATrackerReportSummary";
import { Users as UsersIcon } from "lucide-react";

// Helper types
interface DropdownTaskMap {
  [taskId: string]: number | string | undefined;
}

const QATrackerReportView: React.FC = () => {
  const { user } = useAuth();
  const [trackers, setTrackers] = useState<TrackerRow[]>([]);
  const [allTrackers, setAllTrackers] = useState<TrackerRow[]>([]); // Store all trackers for filtering
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [assignedAgents, setAssignedAgents] = useState<UserRef[]>([]);
  const [loadingAgents, setLoadingAgents] = useState<boolean>(false);

  // Filter states
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(getTodayDate());
  const [endDate, setEndDate] = useState<string>(getTodayDate());

  // Store per-hour targets from dropdown API
  const [dropdownTaskMap, setDropdownTaskMap] = useState<DropdownTaskMap>({});

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedTrackerForEdit, setSelectedTrackerForEdit] =
    useState<TrackerRow | null>(null);

  // Fetch agents, trackers, and per-hour targets from dropdown/get and dashboard/filter
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoadingAgents(true);
        setLoading(true);

        // Fetch per-hour targets from dropdown/get
        const dropdownRes = await fetchDropdownData({
          dropdown_type: "projects with tasks",
          logged_in_user_id: user?.user_id,
        });

        const projectsWithTasks = Array.isArray(dropdownRes?.data)
          ? (dropdownRes.data as ProjectRef[])
          : [];
        const taskMap: DropdownTaskMap = {};
        projectsWithTasks.forEach((project: ProjectRef) => {
          (project.tasks || []).forEach((task: TaskRef) => {
            if (task.task_id != null)
              taskMap[String(task.task_id)] = task.task_target;
          });
        });
        setDropdownTaskMap(taskMap);

        const payload: DashboardFilterPayload = {
          logged_in_user_id: user?.user_id ?? "",
          device_id:
            typeof user?.device_id === "string" ? user.device_id : "web123",
          device_type:
            typeof user?.device_type === "string" ? user.device_type : "web",
        };

        const res = await fetchDashboardData(payload);
        const data = res?.data || {};

        let filteredAgents: UserRef[] = [];
        let filteredTrackers: TrackerRow[] = [];
        const role = String(
          user?.role_name || user?.user_role || "",
        ).toLowerCase();
        const allUsers: UserRef[] = Array.isArray(data.users) ? data.users : [];
        const allTrackersData: TrackerRow[] = Array.isArray(data.tracker)
          ? data.tracker
          : [];
        const allTasks: TaskRef[] = Array.isArray(data.tasks) ? data.tasks : [];

        const taskNameMap: { [taskId: string]: string } = {};
        allTasks.forEach((task: TaskRef) => {
          if (task.task_id != null)
            taskNameMap[String(task.task_id)] = task.task_name || "";
        });

        if (role === "assistant manager") {
          let myTeamIds: string[] = [];
          if (data.projects) {
            data.projects.forEach((p) => {
              if (
                p.asst_project_manager_id &&
                user &&
                p.asst_project_manager_id.includes(String(user.user_id))
              ) {
                if (p.project_team_id) {
                  const ids = p.project_team_id
                    .replace(/\[|\]/g, "")
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean);
                  myTeamIds.push(...ids);
                }
              }
            });
          }
          filteredAgents = allUsers.filter((u) =>
            myTeamIds.includes(String(u.user_id)),
          );
          filteredTrackers = allTrackersData.filter((t) =>
            myTeamIds.includes(String(t.user_id)),
          );
        } else if (role === "project manager") {
          let myProjectIds: string[] = [];
          if (data.projects) {
            data.projects.forEach((p) => {
              if (
                user &&
                String(p.project_manager_id) === String(user.user_id)
              ) {
                if (p.project_team_id) {
                  const ids = p.project_team_id
                    .replace(/\[|\]/g, "")
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean);
                  myProjectIds.push(...ids);
                }
              }
            });
          }
          filteredAgents = allUsers.filter((u) =>
            myProjectIds.includes(String(u.user_id)),
          );
          filteredTrackers = allTrackersData.filter((t) =>
            myProjectIds.includes(String(t.user_id)),
          );
        } else if (
          role === "qa" ||
          role === "qa agent" ||
          role === "quality analyst"
        ) {
          let myQAIds: string[] = [];
          if (data.projects) {
            data.projects.forEach((p) => {
              if (
                p.project_qa_id &&
                user &&
                p.project_qa_id.includes(String(user.user_id))
              ) {
                if (p.project_team_id) {
                  const ids = p.project_team_id
                    .replace(/\[|\]/g, "")
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean);
                  myQAIds.push(...ids);
                }
              }
            });
          }
          filteredAgents = allUsers.filter((u) =>
            myQAIds.includes(String(u.user_id)),
          );
          filteredTrackers = allTrackersData.filter((t) =>
            myQAIds.includes(String(t.user_id)),
          );
        } else {
          filteredAgents = allUsers;
          filteredTrackers = allTrackersData;
        }

        // Enrich trackers with task_name from taskNameMap
        filteredTrackers = filteredTrackers.map((tracker) => ({
          ...tracker,
          task_name:
            tracker.task_name || taskNameMap[String(tracker.task_id)] || "-",
        }));

        setAssignedAgents(filteredAgents);
        setAllTrackers(filteredTrackers);
        setTrackers(filteredTrackers);
      } catch (err) {
        console.error(
          "[QATrackerReportView] Error fetching dashboard/filter:",
          err,
        );
        toast.error("Failed to load agent/tracker data");
        setAssignedAgents([]);
        setAllTrackers([]);
        setTrackers([]);
      } finally {
        setLoadingAgents(false);
        setLoading(false);
      }
    };

    if (user?.user_id) {
      loadDashboardData();
    }
  }, [user?.user_role, user]);

  // Filter trackers by selected agent and date range
  useEffect(() => {
    if (!user?.user_id) return;

    setLoading(true);
    setError("");

    // Filter trackers in memory
    let filtered: TrackerRow[] = allTrackers;

    if (selectedAgent) {
      filtered = filtered.filter(
        (t) => String(t.user_id) === String(selectedAgent),
      );
    }
    if (startDate) {
      filtered = filtered.filter(
        (t) => t.date_time && t.date_time >= startDate,
      );
    }
    if (endDate) {
      filtered = filtered.filter(
        (t) => t.date_time && t.date_time <= endDate + " 23:59:59",
      );
    }

    setTrackers(filtered);
    setLoading(false);
  }, [selectedAgent, startDate, endDate, allTrackers, user?.user_id]);

  // Clear filters
  const handleClearFilters = () => {
    setSelectedAgent("");
    setStartDate(getTodayDate());
    setEndDate(getTodayDate());
  };

  // Calculate totals from filtered trackers
  const totals = useMemo(() => {
    const uniqueUserIds = new Set<string | number>();
    const baseTotals = trackers.reduce(
      (
        acc: {
          tenureTarget: number;
          production: number;
          billableHours: number;
        },
        tracker: TrackerRow,
      ) => {
        if (tracker.user_id) uniqueUserIds.add(tracker.user_id);
        acc.tenureTarget += Number(tracker.tenure_target) || 0;
        acc.production += Number(tracker.production) || 0;
        acc.billableHours += Number(tracker.billable_hours) || 0;
        return acc;
      },
      { tenureTarget: 0, production: 0, billableHours: 0 },
    );

    const activeAgents = uniqueUserIds.size;
    const assignedHours = activeAgents * 9;

    return {
      ...baseTotals,
      activeAgents,
      assignedHours,
    };
  }, [trackers]);

  // Export to Excel function
  const handleExportToExcel = () => {
    const filename = `QA_Tracker_Report_${startDate}_to_${endDate}.xlsx`;
    const exportData = trackers.map((tracker: TrackerRow) => ({
      "Date/Time": tracker.date_time
        ? format(new Date(tracker.date_time), "M/d/yyyy h:mm a")
        : "-",
      Agent: tracker.user_name || "-",
      Project: tracker.project_name || "-",
      Task: tracker.task_name || "-",
      "Per Hour Target": tracker.tenure_target || 0,
      Production: tracker.production || 0,
      "Billable Hours":
        tracker.billable_hours !== null && tracker.billable_hours !== undefined
          ? Number(tracker.billable_hours).toFixed(2)
          : "0.00",
      "Has File": tracker.tracker_file ? "Yes" : "No",
    }));

    // Add totals row
    exportData.push({
      "Date/Time": "",
      Agent: "",
      Project: "",
      Task: "TOTALS",
      "Per Hour Target": totals.tenureTarget.toFixed(2),
      Production: totals.production.toFixed(2),
      "Billable Hours": totals.billableHours.toFixed(2),
      "Has File": "",
    });

    exportToExcel(exportData, filename, "Tracker Report");
  };

  // Handle edit action
  const handleEdit = (tracker: TrackerRow) => {
    setSelectedTrackerForEdit(tracker);
    setIsEditModalOpen(true);
  };

  // Handle delete action
  const handleDelete = async (tracker: TrackerRow) => {
    if (window.confirm("Are you sure you want to delete this tracker entry?")) {
      try {
        setLoading(true);
        if (tracker.tracker_id) {
          const res = await deleteTrackerEntry(tracker.tracker_id);
          if (res.status === 200 || res.status === true) {
            toast.success("Tracker deleted successfully");
            setAllTrackers((prev) =>
              prev.filter((t) => t.tracker_id !== tracker.tracker_id),
            );
          } else {
            toast.error(res.message || "Failed to delete tracker");
          }
        }
      } catch (err) {
        console.error("Delete error:", err);
        toast.error("An error occurred while deleting");
      } finally {
        setLoading(false);
      }
    }
  };

  // Create columns with dependencies
  const columns = useMemo(
    () =>
      createColumns({
        dropdownTaskMap,
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    [dropdownTaskMap],
  );

  return (
    <div className="space-y-6">
      <QATrackerReportHeader
        onExport={handleExportToExcel}
        isLoading={loading}
        hasData={trackers.length > 0}
      />

      <QATrackerReportFilters
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        selectedAgent={selectedAgent}
        setSelectedAgent={setSelectedAgent}
        assignedAgents={assignedAgents}
        isLoadingAgents={loadingAgents}
        onClearFilters={handleClearFilters}
      />

      {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={trackers}
        loading={loading}
        emptyMessage="No tracker data found"
        emptyIcon={UsersIcon}
        showPagination={true}
        pageSize={10}
        headerClassName="bg-blue-50"
      />

      <QATrackerReportSummary
        totals={totals}
        isLoading={loading}
        hasData={trackers.length > 0}
      />
      {/* Modal Section */}
      <TrackerEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTrackerForEdit(null);
        }}
        tracker={selectedTrackerForEdit}
        onSuccess={() => {
          // Re-fetch data
          window.location.reload();
        }}
      />
    </div>
  );
};

export default QATrackerReportView;
