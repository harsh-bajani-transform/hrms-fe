import { useMemo, useState, useCallback, useEffect } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { fetchDashboardData } from "../../services/dashboardService";
import { fetchProjectsList } from "../../services/projectService";

import { MONTHLY_GOAL } from "../../../../lib/constants";
import { useAuth } from "../../../../context/AuthContext";
import { useDeviceInfo } from "../../../../hooks/useDeviceInfo";

import FilterBar from "../components/FilterBar";
import TabsNavigation from "../components/TabsNavigation";
import OverviewTab from "../components/overview/OverviewTab";
import BillableReport from "../components/BillableReport";
import QATrackerReport from "../components/QATrackerReport";
import QAAgentList from "../components/QAAgentList";
import AssistantManagerDashboard from "../components/AssistantManagerDashboard";
import QAAgentDashboard from "../components/QAAgentDashboard";
import ManageView from "../../../manage/ui/views/ManageView";
import AgentBillableReport from "../../../agent/ui/components/AgentBillableReport";
import AppLayout from "../../../../components/layout/AppLayout";

import type {
  Analytics,
  DashboardFilterData,
  DashboardFilterPayload,
  DateRange,
  ProjectRef,
  TrackerRow,
} from "../../types";
import type { HourlyChartDatum } from "../components/overview/HourlyChart";

const DashboardView = () => {
  const {
    user: currentUser,
    canManageUsers,
    canManageProjects,
    isSuperAdmin,
  } = useAuth();

  const { device_id, device_type } = useDeviceInfo();

  // TanStack Router search params
  const searchParams = useSearch({ from: "/dashboard" });
  const viewParam = searchParams.view;
  const tabParam = searchParams.tab;

  // State
  const [dateRange, setDateRange] = useState<DateRange>({ start: "", end: "" });
  const [selectedTask, setSelectedTask] = useState<string>("All");
  const [comparisonMode, setComparisonMode] =
    useState<string>("previous_period");

  const activeTab = tabParam || "overview";

  const [managedProjects, setManagedProjects] = useState<ProjectRef[]>([]);

  // Role Logic
  const role = String(currentUser?.role_name ?? "");
  const userRole = String(currentUser?.user_role ?? "");
  const designation = String(
    currentUser?.designation ?? currentUser?.user_designation ?? "",
  );
  const roleId = Number(currentUser?.role_id);

  const isAdmin =
    roleId === 1 ||
    role.toLowerCase() === "admin" ||
    userRole.toUpperCase() === "ADMIN" ||
    designation === "Admin";

  const isAgent =
    roleId === 6 ||
    role.toLowerCase() === "agent" ||
    userRole.toUpperCase() === "AGENT" ||
    designation === "Agent";

  const isQA =
    roleId === 5 ||
    designation === "QA" ||
    designation === "Quality Analyst" ||
    role.toLowerCase().includes("qa");

  const isAssistantManager =
    roleId === 4 ||
    designation === "Assistant Manager" ||
    role.toLowerCase().includes("assistant");

  const isProjectManager =
    roleId === 3 ||
    designation === "Project Manager" ||
    role.toLowerCase().includes("project_manager");

  const canAccessManage = canManageUsers || canManageProjects || isSuperAdmin;
  const canViewIncentivesTab =
    isAdmin ||
    userRole.toUpperCase() === "FINANCE_HR" ||
    isProjectManager ||
    isSuperAdmin;
  const canViewAdherence = isAdmin || isProjectManager || isQA || isSuperAdmin;

  const navigate = useNavigate({ from: "/dashboard" });

  const handleTabChange = useCallback(
    (newTab: string) => {
      // With the router registered in `src/declarations.d.ts`, TanStack Router can type search params.
      navigate({
        search: (prev) => ({
          ...prev,
          tab: newTab,
        }),
      });
    },
    [navigate],
  );

  // RBAC Redirection: Admin/PM roles should default to 'manage' tab
  useEffect(() => {
    if (!tabParam && !isAgent && !isQA && !isAssistantManager) {
      navigate({
        search: (prev) => ({
          ...prev,
          tab: "manage",
        }),
        replace: true,
      });
    }
  }, [isAgent, isQA, isAssistantManager, tabParam, navigate]);

  // Load projects if needed
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await fetchProjectsList();
        if (res.status === 200) {
          setManagedProjects(res.data);
        }
      } catch (err) {
        console.error("Failed to load projects", err);
      }
    };

    if (!isAgent) {
      void loadProjects();
    }
  }, [isAgent]);

  const allTasks = useMemo((): string[] => {
    const tasks = new Set<string>();

    managedProjects.forEach((p) =>
      p.tasks?.forEach((t) => {
        const name = t.name ?? t.task_name;
        if (name) tasks.add(name);
      }),
    );

    return Array.from(tasks).sort();
  }, [managedProjects]);

  const handleDateRangeChange = useCallback(
    (field: keyof DateRange, value: string) => {
      setDateRange((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const [adminDashboardData, setAdminDashboardData] =
    useState<DashboardFilterData | null>(null);

  // Fetch admin dashboard data
  useEffect(() => {
    const loadAdminDashboard = async () => {
      if (currentUser?.user_id == null) return;

      try {
        const todayStr = new Date().toISOString().slice(0, 10);
        const isDefaultOrToday =
          (dateRange.start === "" && dateRange.end === "") ||
          (dateRange.start === todayStr && dateRange.end === todayStr);

        const basePayload: DashboardFilterPayload = {
          logged_in_user_id: currentUser.user_id,
          device_id: device_id || "web",
          device_type: device_type || "web",
        };

        const payload: DashboardFilterPayload = isDefaultOrToday
          ? { ...basePayload, date: todayStr }
          : {
              ...basePayload,
              ...(dateRange.start
                ? { date_from: dateRange.start.slice(0, 10) }
                : {}),
              ...(dateRange.end ? { date_to: dateRange.end.slice(0, 10) } : {}),
            };

        const res = await fetchDashboardData(payload);
        if (res.status === 200) {
          setAdminDashboardData(res.data);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
        toast.error("Failed to load dashboard data");
      }
    };

    if (!isAgent && currentUser?.user_id != null) {
      void loadAdminDashboard();
    }
  }, [isAgent, currentUser?.user_id, device_id, device_type, dateRange]);

  const analytics = useMemo<Analytics>(() => {
    if (isAgent || !adminDashboardData) {
      return {
        prodCurrent: 0,
        prodPrevious: 0,
        trendText: "0%",
        trendDir: "neutral",
        monthTotal: 0,
        goalProgress: 0,
        effectiveGoal: 0,
        agentStats: [],
        prevRange: { label: "Prev Period" },
      };
    }

    const summary = adminDashboardData.summary;

    return {
      prodCurrent: Number(summary?.total_production ?? 0),
      prodPrevious: 0,
      trendText: "N/A",
      trendDir: "neutral",
      monthTotal: Number(summary?.total_production ?? 0),
      goalProgress: Number(summary?.goal_progress ?? 0),
      effectiveGoal: MONTHLY_GOAL,
      agentStats: adminDashboardData.users ?? [],
      prevRange: { label: "Prev Period" },
    };
  }, [isAgent, adminDashboardData]);

  const hourlyChartData = useMemo<HourlyChartDatum[]>(() => {
    const SHIFT_START_HOUR = 10;
    const SHIFT_HOURS_COUNT = 9;

    const data: HourlyChartDatum[] = Array.from(
      { length: SHIFT_HOURS_COUNT },
      (_, i) => ({
        hour: SHIFT_START_HOUR + i,
        label:
          SHIFT_START_HOUR + i > 12
            ? `${SHIFT_START_HOUR + i - 12} PM`
            : `${SHIFT_START_HOUR + i} AM`,
        production: 0,
        target: 0,
      }),
    );

    const tracker = (adminDashboardData?.tracker ?? []) as TrackerRow[];

    tracker.forEach((log) => {
      const hour = log.date_time ? new Date(log.date_time).getHours() : 0;
      const hourIdx = hour - SHIFT_START_HOUR;
      if (hourIdx >= 0 && hourIdx < SHIFT_HOURS_COUNT) {
        const bucket = data[hourIdx];
        if (!bucket) return;
        bucket.production += Number(log.production ?? 0);
        bucket.target += Number(log.tenure_target ?? 0);
      }
    });

    return data;
  }, [adminDashboardData]);

  const renderSpecialView = () => {
    if (viewParam === "tracker-report") {
      return <QATrackerReport />;
    }
    if (viewParam === "agent-list") {
      return <QAAgentList />;
    }
    return null;
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-10 px-4 sm:px-6 lg:px-8 pt-6">
        {/* Special Views override anything else */}
        {viewParam ? (
          renderSpecialView()
        ) : (
          <>
            {/* Filter Bar */}
            {activeTab === "overview" && !isAssistantManager && (
              <FilterBar
                isAgent={isAgent}
                isQA={isQA}
                selectedTask={selectedTask}
                setSelectedTask={setSelectedTask}
                comparisonMode={comparisonMode}
                setComparisonMode={setComparisonMode}
                dateRange={dateRange}
                handleDateRangeChange={handleDateRangeChange}
                allTasks={allTasks}
              />
            )}

            {/* Tabs */}
            {activeTab !== "manage" && (
              <TabsNavigation
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                isAgent={isAgent}
                isQA={isQA}
                canViewIncentivesTab={canViewIncentivesTab}
                canViewAdherence={canViewAdherence}
                canAccessManage={canAccessManage}
              />
            )}

            {/* Content Area */}
            {activeTab === "overview" &&
              (isQA ? (
                <QAAgentDashboard dateRange={dateRange} />
              ) : isAssistantManager ? (
                <AssistantManagerDashboard />
              ) : (
                <OverviewTab
                  analytics={analytics}
                  hourlyChartData={hourlyChartData}
                  isAgent={isAgent}
                  isQA={isQA}
                  dateRange={dateRange}
                />
              ))}

            {activeTab === "billable_report" &&
              (isAgent ? <AgentBillableReport /> : <BillableReport />)}

            {activeTab === "manage" && <ManageView />}

            {/* Fallback for other tabs */}
            {activeTab !== "overview" && activeTab !== "manage" && (
              <div className="bg-white p-12 rounded-lg shadow-sm border border-dashed border-slate-300 text-center">
                <h3 className="text-lg font-medium text-slate-500">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}{" "}
                  Module Coming Soon
                </h3>
                <p className="text-slate-400 mt-2">
                  We are currently migrating this section.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default DashboardView;
