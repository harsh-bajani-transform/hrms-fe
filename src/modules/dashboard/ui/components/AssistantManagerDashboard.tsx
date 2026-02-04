import React, { useEffect, useState, FC } from "react";
import { format } from "date-fns";
import {
  FileText,
  Users,
  Clock,
  TrendingUp,
  Download,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "../../../../context/AuthContext";
import { useDeviceInfo } from "../../../../hooks/useDeviceInfo";
import api from "../../../../services/api";
import { getFriendlyErrorMessage } from "../../../../utils/errorMessages";
import ErrorMessage from "../../../../components/common/ErrorMessage";
import type {
  TrackerRow,
  DashboardSummary,
  TaskRef,
} from "../../../dashboard/types";

const AssistantManagerDashboard: FC = () => {
  const { user } = useAuth();
  const { device_id, device_type } = useDeviceInfo();

  // By default, no date range (empty strings)
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });
  type LatestQcRow = TrackerRow & {
    file_name: string;
    qc_score: number | string;
    date: string;
    task_name: string;
  };
  const [stats, setStats] = useState<{
    totalAgents: number;
    qcPending: number;
    billableHours: number;
    avgQcScore: number;
    latestQc: LatestQcRow[];
  }>({
    totalAgents: 0,
    qcPending: 0,
    billableHours: 0,
    avgQcScore: 0,
    latestQc: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch reference data for dropdowns
  useEffect(() => {
    const fetchRefData = async () => {
      try {
        const response = await api.post("/dropdown/get", {
          dropdown_type: "projects with tasks",
          logged_in_user_id: user?.user_id,
        });
        console.log("[AssistantManagerDashboard] Dropdown response:", response.data);
      } catch (err) {
        console.error("Error loading dropdowns:", err);
      }
    };
    if (user?.user_id) {
      fetchRefData();
    }
  }, [user?.user_id]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        // If no filter applied, show today's data only (but do not set date in filter UI)
        interface PayloadType {
          logged_in_user_id: string | number | undefined;
          device_id: string;
          device_type: string;
          date_from?: string;
          date_to?: string;
        }

        let payload: PayloadType = {
          logged_in_user_id: user?.user_id || user?.id,
          device_id: device_id || "web_default",
          device_type: device_type || "web",
        };

        if (dateRange.start && dateRange.end) {
          payload.date_from = dateRange.start;
          payload.date_to = dateRange.end;
        } else if (!dateRange.start && !dateRange.end) {
          // Default: show today's data only
          const today = format(new Date(), "yyyy-MM-dd");
          payload.date_from = today;
          payload.date_to = today;
        }

        console.log("[AssistantManagerDashboard] 📤 Payload:", payload);
        const res = await api.post("/dashboard/filter", payload);
        console.log("[AssistantManagerDashboard] 🟢 API response:", res.data);

        if (res.data && res.data.status === 200) {
          const summary = res.data.data?.summary || {};
          const tracker: TrackerRow[] = res.data.data?.tracker || [];
          const tasks: TaskRef[] = res.data.data?.tasks || [];
          const taskMap: Record<string, string> = {};
          tasks.forEach((task) => {
            if (task.task_id)
              taskMap[String(task.task_id)] = task.task_name || "-";
          });

          setStats({
            totalAgents: Number(summary.user_count) || 0,
            qcPending: Number(summary.qc_pending) || 0,
            billableHours: Number(summary.total_billable_hours) || 0,
            avgQcScore: Number(summary.avg_qc_score) || 0,
            latestQc: tracker
              .filter((row) => !!row.tracker_file)
              .map((row) => ({
                ...row,
                file_name: row.project_name || "-",
                qc_score: row.qc_score ?? "-",
                date:
                  typeof row.date_time === "string"
                    ? (row.date_time.split(" ")[0] ?? "-")
                    : "-",
                task_name: row.task_name || taskMap[String(row.task_id)] || "-",
              })),
          });
        }
      } catch (err: any) {
        console.error(
          "[AssistantManagerDashboard] Error fetching dashboard:",
          err,
        );
        setError(getFriendlyErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    if (user?.user_id) {
      fetchDashboard();
    }
  }, [user, dateRange, device_id, device_type]);

  const handleDateRangeChange = (field: "start" | "end", value: string) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={error}
          onRetry={() => {
            setError(null);
            setDateRange({ ...dateRange });
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Filter className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Organization Analytics
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Start Date */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                From:
              </label>
              <Input
                className="h-9 w-auto border-gray-300"
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange("start", e.target.value)}
                aria-label="Start date"
              />
            </div>
            {/* End Date */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                To:
              </label>
              <Input
                className="h-9 w-auto border-gray-300"
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateRangeChange("end", e.target.value)}
                aria-label="End date"
              />
            </div>
            {/* Clear Filter Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setDateRange({ start: "", end: "" })}
              className="h-9 px-6 border-gray-300"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="font-semibold text-gray-900">Total Agents</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.totalAgents}
          </div>
          <div className="text-sm text-gray-500 mt-1">Assigned agents</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-orange-50 rounded-lg">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <span className="font-semibold text-gray-900">
              Pending QC Files
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.qcPending}
          </div>
          <div className="text-sm text-gray-500 mt-1">Files to review</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-green-50 rounded-lg">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <span className="font-semibold text-gray-900">
              Total Billable Hours
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.billableHours.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500 mt-1">Billable hours</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-purple-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <span className="font-semibold text-gray-900">Avg QC Score</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.avgQcScore}
          </div>
          <div className="text-sm text-gray-500 mt-1">Average QC score</div>
        </div>
      </div>

      {/* Latest QC Done Files */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-linear-to-r from-blue-600 to-blue-700 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Latest QC Done Files
              </h2>
              <p className="text-sm text-blue-100 mt-0.5">
                Files recently reviewed for quality check
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
              <span className="text-gray-600 font-medium">
                Loading QC files...
              </span>
            </div>
          </div>
        ) : stats.latestQc.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-blue-300" />
            </div>
            <p className="text-gray-700 font-semibold text-lg mb-2">
              No QC files found
            </p>
            <p className="text-gray-500">
              No QC files have been reviewed in this period.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {stats.latestQc.map((file, index) => (
              <div
                key={file.tracker_id || index}
                className="px-6 py-4 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-linear-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6 text-blue-700" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 flex-1">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Date/Time
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {file.date_time ? file.date_time.split(" ")[0] : "-"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {file.date_time ? file.date_time.split(" ")[1] : ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Agent
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {file.user_name || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Project
                        </p>
                        <p className="text-sm font-medium text-gray-700">
                          {file.project_name || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Task
                        </p>
                        <p className="text-sm font-medium text-gray-700">
                          {file.task_name || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          File
                        </p>
                        {file.tracker_file ? (
                          <a
                            href={file.tracker_file}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssistantManagerDashboard;
