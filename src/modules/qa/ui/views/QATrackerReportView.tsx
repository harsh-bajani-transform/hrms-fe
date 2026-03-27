import React, { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "../../../../context/AuthContext";
import { useDeviceInfo } from "../../../../hooks/useDeviceInfo";
import { getTodayDate } from "../../../../lib/utils/dateUtils";
import { exportToCSV } from "../../../../lib/utils/exportUtils";
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
  DashboardFilterData,
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
  const { device_id, device_type } = useDeviceInfo();
  const [trackers, setTrackers] = useState<TrackerRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [assignedAgents, setAssignedAgents] = useState<UserRef[]>([]);
  const [loadingAgents, setLoadingAgents] = useState<boolean>(false);
  const [projectsWithTasks, setProjectsWithTasks] = useState<ProjectRef[]>([]);

  // Filter states
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(getTodayDate());
  const [endDate, setEndDate] = useState<string>(getTodayDate());
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<string>("");

  // Store per-hour targets from dropdown API
  const [dropdownTaskMap, setDropdownTaskMap] = useState<DropdownTaskMap>({});
  const [apiTotals, setApiTotals] = useState<DashboardFilterData["totals"] | null>(null);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedTrackerForEdit, setSelectedTrackerForEdit] =
    useState<TrackerRow | null>(null);

  // Fetch agents, trackers, and per-hour targets from dropdown/get and dashboard/filter
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.user_id) return;

      try {
        setLoadingAgents(true);
        setLoading(true);

        // 1. Fetch per-hour targets from dropdown/get
        const dropdownRes = await fetchDropdownData({
          dropdown_type: "projects with tasks",
          logged_in_user_id: user.user_id,
        });

        const projectsWithTasks = Array.isArray(dropdownRes?.data)
          ? (dropdownRes.data as ProjectRef[])
          : [];
        setProjectsWithTasks(projectsWithTasks);

        const taskMap: DropdownTaskMap = {};
        projectsWithTasks.forEach((project: ProjectRef) => {
          (project.tasks || []).forEach((task: TaskRef) => {
            if (task.task_id != null)
              taskMap[String(task.task_id)] = task.task_target;
          });
        });
        setDropdownTaskMap(taskMap);

        // 2. Fetch filtered dashboard data
        const payload: DashboardFilterPayload = {
          logged_in_user_id: user.user_id,
          device_id,
          device_type,
          date_from: startDate,
          date_to: endDate,
          user_id: selectedAgent || undefined,
          team_id: selectedTeam || undefined,
          project_id: selectedProject || undefined,
          task_id: selectedTask || undefined,
        };

        const res = await fetchDashboardData(payload);
        const data = res?.data || {};
        
        if (data.totals) {
          setApiTotals(data.totals);
        }

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

        // Enrich trackers with task_name
        const enrichedTrackers = allTrackersData.map((tracker) => ({
          ...tracker,
          task_name:
            tracker.task_name || taskNameMap[String(tracker.task_id)] || "-",
        }));

        setAssignedAgents(allUsers);
        setTrackers(enrichedTrackers);
      } catch (err) {
        console.error(
          "[QATrackerReportView] Error loading dashboard data:",
          err,
        );
        toast.error("Failed to load agent/tracker data");
      } finally {
        setLoadingAgents(false);
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [
    user?.user_id,
    device_id,
    device_type,
    startDate,
    endDate,
    selectedAgent,
    selectedTeam,
    selectedProject,
    selectedTask,
  ]);

  // Clear filters
  const handleClearFilters = () => {
    setSelectedAgent("");
    setSelectedTeam("");
    setSelectedProject("");
    setSelectedTask("");
    setStartDate(getTodayDate());
    setEndDate(getTodayDate());
  };

  // Cascading Filter Logic
  const teams = useMemo(() => {
    return Array.from(
      new Set(assignedAgents.map((a) => a.team_name).filter(Boolean)),
    ) as string[];
  }, [assignedAgents]);

  const filteredAgents = useMemo(() => {
    if (!selectedTeam) return assignedAgents;
    return assignedAgents.filter((a) => a.team_name === selectedTeam);
  }, [assignedAgents, selectedTeam]);

  const filteredTasks = useMemo(() => {
    if (!selectedProject) return [];
    const project = projectsWithTasks.find(
      (p) => String(p.project_id) === String(selectedProject),
    );
    return project?.tasks || [];
  }, [projectsWithTasks, selectedProject]);

  // Reset dependent filters when parent changes
  useEffect(() => {
    if (selectedTeam) {
      const isAgentInTeam = filteredAgents.some(
        (a) => String(a.user_id) === String(selectedAgent),
      );
      if (!isAgentInTeam) setSelectedAgent("");
    }
  }, [selectedTeam, filteredAgents, selectedAgent]);

  useEffect(() => {
    if (selectedProject) {
      const isTaskInProject = filteredTasks.some(
        (t) => String(t.task_id) === String(selectedTask),
      );
      if (!isTaskInProject) setSelectedTask("");
    } else {
      setSelectedTask("");
    }
  }, [selectedProject, filteredTasks, selectedTask]);

  // Calculate totals from filtered trackers or API
  const totals = useMemo(() => {
    if (apiTotals) {
      return {
        tenureTarget: Number(apiTotals.total_tenure_target) || 0,
        production: Number(apiTotals.total_production) || 0,
        billableHours: Number(apiTotals.total_billable_hours) || 0,
        activeAgents: Number(apiTotals.total_active_agents) || 0,
        assignedHours: Number(apiTotals.total_assigned_hours) || 0,
      };
    }

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
  }, [trackers, apiTotals]);

  // Export to CSV function
  const handleExportToCSV = () => {
    const filename = `QA_Tracker_Report_${startDate}_to_${endDate}.csv`;
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

    exportToCSV(exportData, filename);
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
            setTrackers((prev) =>
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
        onExport={handleExportToCSV}
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
        selectedTeam={selectedTeam}
        setSelectedTeam={setSelectedTeam}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        selectedTask={selectedTask}
        setSelectedTask={setSelectedTask}
        assignedAgents={filteredAgents}
        teams={teams}
        projects={projectsWithTasks}
        tasks={filteredTasks}
        isLoadingAgents={loadingAgents}
        onClearFilters={handleClearFilters}
      />

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
