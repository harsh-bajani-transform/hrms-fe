import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Activity,
  Calendar,
  Target,
  Users,
  Clock,
  CheckCircle,
  TrendingUp,
  Award,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

import StatCard from "./StatCard";
import HourlyChart, { type HourlyChartDatum } from "./HourlyChart";
import { useAuth } from "../../../../../context/AuthContext";
import { useDeviceInfo } from "../../../../../hooks/useDeviceInfo";
import { fetchDashboardData } from "../../../services/dashboardService";
import AgentBillableReport from "../../../../agent/ui/components/AgentBillableReport";
import AgentTabsNavigation from "../../../../agent/ui/components/AgentTabsNavigation";
import type { AgentTabId } from "../../../../agent/types";
import api from "../../../../../services/api";
import { logError } from "../../../../../config/environment";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import type {
  ApiEnvelope,
  Analytics,
  DateRange,
  DashboardFilterData,
  TrackerRow,
  ProjectRef,
} from "../../../types";

export interface OverviewTabProps {
  analytics?: Analytics;
  hourlyChartData?: HourlyChartDatum[];
  isAgent: boolean;
  isQA?: boolean;
  dateRange?: DateRange;
}

interface QASummaryRow {
  month_year?: string;
  total_billable_hours_month?: number | string;
  pending_days?: number | string;
}

interface QATrackerViewData {
  month_summary?: QASummaryRow[];
  trackers?: TrackerRow[];
}

const getTodayDate = (): string => new Date().toISOString().split("T")[0] ?? "";

const OverviewTab = ({
  analytics,
  hourlyChartData,
  isAgent,
  isQA,
  dateRange,
}: OverviewTabProps) => {
  const { user } = useAuth();
  const { device_id, device_type } = useDeviceInfo();

  const [dashboardData, setDashboardData] =
    useState<DashboardFilterData | null>(null);
  const [loading, setLoading] = useState(false);

  const [qaStartDate, setQaStartDate] = useState<string>(getTodayDate());
  const [qaEndDate, setQaEndDate] = useState<string>(getTodayDate());
  const [qaSummary, setQaSummary] = useState<QASummaryRow[]>([]);
  const [qaTrackers, setQaTrackers] = useState<TrackerRow[]>([]);
  const [qaLoading, setQaLoading] = useState(false);

  const processedDateRange = useMemo<DateRange>(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
    );
    const firstDayStr = firstDayOfMonth.toISOString().slice(0, 10);
    const lastDayStr = lastDayOfMonth.toISOString().slice(0, 10);

    if (!dateRange || (!dateRange.start && !dateRange.end)) {
      return { start: firstDayStr, end: lastDayStr };
    }

    return dateRange;
  }, [dateRange]);

  const getDashboardData = useCallback(async (): Promise<void> => {
    if (!user?.user_id) return;

    try {
      setLoading(true);

      const todayStr = new Date().toISOString().slice(0, 10);
      const isDefaultOrToday =
        (processedDateRange.start === "" && processedDateRange.end === "") ||
        (processedDateRange.start === todayStr &&
          processedDateRange.end === todayStr);

      const payload = {
        logged_in_user_id: user.user_id,
        device_id: device_id || "web_default",
        device_type: device_type || "web",
        ...(isDefaultOrToday
          ? { date: todayStr }
          : {
              date_from: processedDateRange.start,
              date_to: processedDateRange.end,
            }),
      };

      const response = await fetchDashboardData(payload);

      if (response.status === 200) {
        setDashboardData(response.data);
      } else {
        toast.error("Failed to load dashboard data");
      }
    } catch (error: unknown) {
      logError("[OverviewTab] Error fetching dashboard data:", error);

      if (axios.isAxiosError(error)) {
        const message =
          (error.response?.data as { message?: string } | undefined)?.message ??
          error.message;
        toast.error(`Backend Error: ${message}`);
      } else if (error instanceof Error) {
        toast.error(`Backend Error: ${error.message}`);
      } else {
        toast.error("Failed to load dashboard data");
      }
    } finally {
      setLoading(false);
    }
  }, [user?.user_id, device_id, device_type, processedDateRange]);

  const fetchQADashboardData = useCallback(async (): Promise<void> => {
    if (!user?.user_id) return;

    try {
      setQaLoading(true);

      const payload = {
        logged_in_user_id: user.user_id,
        date_from: qaStartDate,
        date_to: qaEndDate,
      };

      const response = await api.post<ApiEnvelope<QATrackerViewData>>(
        "/tracker/view",
        payload,
      );

      if (response.data?.status === 200) {
        setQaSummary(response.data.data?.month_summary ?? []);
        setQaTrackers(response.data.data?.trackers ?? []);
      } else {
        toast.error("Failed to load QA dashboard data");
        setQaSummary([]);
        setQaTrackers([]);
      }
    } catch (error: unknown) {
      logError("[OverviewTab] Error fetching QA dashboard data:", error);
      toast.error("Failed to load QA dashboard data");
      setQaSummary([]);
      setQaTrackers([]);
    } finally {
      setQaLoading(false);
    }
  }, [user?.user_id, qaStartDate, qaEndDate]);

  useEffect(() => {
    if (isAgent && user?.user_id) {
      void getDashboardData();
    }
  }, [isAgent, user?.user_id, getDashboardData]);

  useEffect(() => {
    if (isQA && user?.user_id) {
      void fetchQADashboardData();
    }
  }, [isQA, user?.user_id, qaStartDate, qaEndDate, fetchQADashboardData]);

  const agentStats = useMemo(() => {
    const summary = dashboardData?.summary;

    return {
      totalBillableHours: Number(
        summary?.total_billable_hours ?? summary?.total_production ?? 0,
      ),
      qcScore: Number(summary?.qc_score ?? 0),
      taskCount: Number(summary?.task_count ?? 0),
      projectCount: Number(summary?.project_count ?? 0),
    };
  }, [dashboardData]);

  const agentProjects = (dashboardData?.projects ?? []) as ProjectRef[];

  const agentHourlyChartData = useMemo<HourlyChartDatum[]>(() => {
    if (!isAgent) return hourlyChartData ?? [];

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

    const tracker = (dashboardData?.tracker ?? []) as TrackerRow[];

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
  }, [isAgent, dashboardData, hourlyChartData]);

  const totalQABillableHours = useMemo(() => {
    return qaSummary
      .reduce(
        (sum, s) => sum + (Number(s.total_billable_hours_month ?? 0) || 0),
        0,
      )
      .toFixed(2);
  }, [qaSummary]);

  const firstQASummary = qaSummary[0];

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      {/* QA DASHBOARD FILTERS & ANALYTICS */}
      {isQA && (
        <div className="space-y-6">
          {/* Filter Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Date Range Filter</h3>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={qaStartDate}
                  onChange={(e) => setQaStartDate(e.target.value)}
                  className="h-11 border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <Input
                  type="date"
                  value={qaEndDate}
                  onChange={(e) => setQaEndDate(e.target.value)}
                  className="h-11 border-gray-300"
                />
              </div>
              <Button
                onClick={() => {
                  setQaStartDate(getTodayDate());
                  setQaEndDate(getTodayDate());
                }}
                variant="outline"
                className="h-11 px-6"
                type="button"
              >
                Reset to Today
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-4">
            <StatCard
              title="Total Agents"
              value={qaSummary.length}
              subtext="In range"
              icon={Users}
              trend="neutral"
              tooltip="Total agents in summary."
              className="min-w-0"
            />
            <StatCard
              title="Total Billable Hours"
              value={totalQABillableHours}
              subtext="All agents"
              icon={Clock}
              trend="neutral"
              tooltip="Sum of billable hours for all agents."
              className="min-w-0"
            />
            <StatCard
              title="Month"
              value={firstQASummary?.month_year ?? "-"}
              subtext="Current"
              icon={Calendar}
              trend="neutral"
              tooltip="Month-Year of summary."
              className="min-w-0"
            />
            <StatCard
              title="Pending Days"
              value={String(firstQASummary?.pending_days ?? "-")}
              subtext="Current"
              icon={Award}
              trend="neutral"
              tooltip="Pending days for first agent."
              className="min-w-0"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {qaLoading ? (
              <div className="py-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading QA dashboard...</p>
              </div>
            ) : qaTrackers.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500">No tracker data found for this range.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date-Time
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Agent
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Task
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Billable Hours
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {qaTrackers.map((row, idx) => (
                      <tr
                        key={String(row.tracker_id ?? idx)}
                        className="hover:bg-blue-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium whitespace-nowrap">
                          {row.date_time ?? "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                          {row.user_name ?? "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {row.project_name ?? "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {row.task_name ?? "-"}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-blue-600 font-bold">
                          {row.billable_hours != null
                            ? Number(row.billable_hours).toFixed(2)
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {isAgent ? (
          <>
            <StatCard
              title="Total Billable Hours"
              value={agentStats.totalBillableHours.toFixed(2)}
              subtext="Hours logged"
              icon={Clock}
              trend="neutral"
              tooltip="Total billable hours tracked."
              className="min-w-0"
            />
            <StatCard
              title="QC Score"
              value={`${agentStats.qcScore}%`}
              subtext="Quality rating"
              icon={CheckCircle}
              trend="neutral"
              tooltip="Quality control score."
              className="min-w-0"
            />
            <StatCard
              title="Performance"
              value={agentStats.taskCount.toLocaleString()}
              subtext="Tasks assigned"
              icon={TrendingUp}
              trend="neutral"
              tooltip="Total tasks assigned to you."
              className="min-w-0"
            />
            <StatCard
              title="Projects"
              value={agentStats.projectCount.toLocaleString()}
              subtext="Active projects"
              icon={Award}
              trend="neutral"
              tooltip="Number of projects you're working on."
              className="min-w-0"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Production (Selected)"
              value={analytics?.prodCurrent.toLocaleString() ?? "0"}
              subtext={analytics?.trendText ?? ""}
              icon={Activity}
              trend={analytics?.trendDir ?? "neutral"}
              tooltip="Total production volume in range."
              className="min-w-0"
            />
            <StatCard
              title={`Production (${analytics?.prevRange.label ?? "Previous"})`}
              value={analytics?.prodPrevious.toLocaleString() ?? "0"}
              subtext="Vs Previous"
              icon={Calendar}
              trend="neutral"
              tooltip="Comparison period volume."
              className="min-w-0"
            />
            <StatCard
              title="MTD Progress"
              value={`${analytics?.goalProgress.toFixed(1) ?? "0.0"}%`}
              subtext={`Target: ${analytics?.effectiveGoal.toLocaleString() ?? "0"}`}
              icon={Target}
              trend="neutral"
              tooltip="% of Monthly Target achieved."
              className="min-w-0"
            />
            <StatCard
              title="Active Agents"
              value={analytics?.agentStats.length ?? 0}
              subtext="In range"
              icon={Users}
              trend="neutral"
              tooltip="Agent Activity count."
              className="min-w-0"
            />
          </>
        )}
      </div>

      {isAgent ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Project Billable Hours
                </h3>
                <p className="text-blue-100 text-sm mt-1">
                  Hours logged per project in selected date range
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-slate-500 mt-3">Loading project data...</p>
              </div>
            ) : agentProjects.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">
                  No project data available
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  You haven't worked on any projects yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {agentProjects.map((project, index) => {
                  const billableHours = Number(
                    project.billable_hours ?? project.total_billable_hours ?? 0,
                  );

                  return (
                    <div
                      key={String(project.project_id ?? index)}
                      className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">
                            {project.project_name}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {project.project_code || "Project"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {billableHours.toFixed(2)}
                        </div>
                        <p className="text-xs text-slate-500">Hours</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full overflow-hidden">
          <HourlyChart data={agentHourlyChartData} />
        </div>
      )}
    </div>
  );
};

export default OverviewTab;
