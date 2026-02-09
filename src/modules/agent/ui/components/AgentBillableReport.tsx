import { useEffect, useState, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

import Loading from "@/components/common/Loading";
import { getFriendlyErrorMessage } from "../../../../utils/errorMessages";
import ErrorMessage from "../../../../components/common/ErrorMessage";
import {
  fetchDailyBillableReport,
  fetchMonthlyBillableReport,
} from "../../../dashboard/services/billableReportService";
import { useAuth } from "../../../../context/AuthContext";
import { DataTable } from "@/components/ui/data-table";
import { createDailyColumns, createMonthlyColumns } from "./AgentBillableReportColumns";

import type { TrackerRow } from "../../../dashboard/types";
import type { MonthlyBillableReportRow } from "../../../dashboard/services/billableReportService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Calendar,
  FileDown,
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle2,
  Filter,
  Download,
} from "lucide-react";

type ToggleTab = "daily" | "monthly";

type DailyExportRow = {
  "Date-Time": string;
  "Assign Hours": string | number;
  "Worked Hours": string | number;
  "QC score": string | number;
  "Daily Required Hours": string | number;
};

type MonthlyExportRow = {
  "Year & Month": string;
  "Billable Hours Delivered": string | number;
  "Monthly Goal": string | number;
  "Pending Target": string | number;
  "Avg. QC Score": string | number;
};

const AgentBillableReport = () => {
  const { user } = useAuth();

  // State for tab toggle
  const [activeToggle, setActiveToggle] = useState<ToggleTab>("daily");

  useEffect(() => {
    // Force daily as default on initial load if not set
    const stored = localStorage.getItem("agent_billable_active_tab");
    if (!stored) {
      localStorage.setItem("agent_billable_active_tab", "daily");
    } else {
      setActiveToggle(stored === "monthly" ? "monthly" : "daily");
    }
  }, []);

  // Persist tab selection to localStorage
  useEffect(() => {
    localStorage.setItem("agent_billable_active_tab", activeToggle);
  }, [activeToggle]);

  // State for date range filter
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState<string>("");

  const [dailyData, setDailyData] = useState<TrackerRow[]>([]);
  const [loadingDaily, setLoadingDaily] = useState<boolean>(false);
  const [errorDaily, setErrorDaily] = useState<string | null>(null);

  // Fetch daily report data from API on mount or when date range/month changes
  useEffect(() => {
    const fetchData = async () => {
      setLoadingDaily(true);
      setErrorDaily(null);
      try {
        const payload: Record<string, unknown> = {};
        if (monthFilter) {
          const [year, month] = monthFilter.split("-");
          const monthNames = [
            "JAN",
            "FEB",
            "MAR",
            "APR",
            "MAY",
            "JUN",
            "JUL",
            "AUG",
            "SEP",
            "OCT",
            "NOV",
            "DEC",
          ];
          const monthLabel = monthNames[Number(month) - 1];
          payload.month_year = `${monthLabel}${year}`;
        } else {
          if (startDate) payload.date_from = startDate;
          if (endDate) payload.date_to = endDate;
        }
        const res = await fetchDailyBillableReport(payload);
        setDailyData(Array.isArray(res.data.trackers) ? res.data.trackers : []);
      } catch (err: unknown) {
        setErrorDaily(
          getFriendlyErrorMessage(err instanceof Error ? err : String(err)),
        );
      } finally {
        setLoadingDaily(false);
      }
    };
    fetchData();
  }, [startDate, endDate, monthFilter]);

  // State for monthly report API
  const [monthlySummaryData, setMonthlySummaryData] = useState<
    MonthlyBillableReportRow[]
  >([]);
  const [loadingMonthly, setLoadingMonthly] = useState<boolean>(false);
  const [errorMonthly, setErrorMonthly] = useState<string | null>(null);
  const [monthlyMonth, setMonthlyMonth] = useState<string>("");

  // Fetch monthly report data
  useEffect(() => {
    if (activeToggle !== "monthly") return;
    const fetchData = async () => {
      setLoadingMonthly(true);
      setErrorMonthly(null);
      try {
        let payload: Record<string, unknown> = {};
        if (monthlyMonth) {
          const [year, month] = monthlyMonth.split("-");
          const monthNames = [
            "JAN",
            "FEB",
            "MAR",
            "APR",
            "MAY",
            "JUN",
            "JUL",
            "AUG",
            "SEP",
            "OCT",
            "NOV",
            "DEC",
          ];
          const monthLabel = monthNames[Number(month) - 1];
          payload = { month_year: `${monthLabel}${year}` };
        }
        if (user?.user_id) payload.logged_in_user_id = user.user_id;
        const res = await fetchMonthlyBillableReport(payload);
        setMonthlySummaryData(Array.isArray(res.data) ? res.data : []);
      } catch (err: unknown) {
        setErrorMonthly(
          getFriendlyErrorMessage(err instanceof Error ? err : String(err)),
        );
      } finally {
        setLoadingMonthly(false);
      }
    };
    fetchData();
  }, [activeToggle, monthlyMonth, user]);

  const filteredDailyData = dailyData;

  // Export handler for month daily excel (must be declared before monthlyColumns)
  const handleExportMonthDailyExcel = useCallback(async (monthYear: string) => {
    try {
      const res = await fetchDailyBillableReport({ month_year: monthYear });
      const trackers: TrackerRow[] = Array.isArray(res.data.trackers)
        ? res.data.trackers
        : [];
      const exportData: DailyExportRow[] = trackers.map((row) => ({
        "Date-Time": row.date_time
          ? dayjs(row.date_time).format("DD-MM-YYYY hh:mm A")
          : "-",
        "Assign Hours": "-",
        "Worked Hours": row.billable_hours
          ? Number(row.billable_hours).toFixed(2)
          : "-",
        "QC score": "-",
        "Daily Required Hours": row.tenure_target
          ? Number(row.tenure_target).toFixed(2)
          : "-",
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Month Daily Report");
      XLSX.writeFile(workbook, `Month_Daily_Report_${monthYear}.xlsx`);
      toast.success("Exported!");
    } catch {
      toast.error("Export failed");
    }
  }, []);

  // Daily table columns
  const dailyColumns = useMemo(() => createDailyColumns(), []);

  // Monthly table columns
  const monthlyColumns = useMemo(
    () => createMonthlyColumns(handleExportMonthDailyExcel),
    [handleExportMonthDailyExcel]
  );

  // Export handlers
  const handleExportMonthlyTable = () => {
    try {
      const exportData: MonthlyExportRow[] = monthlySummaryData.map((row) => ({
        "Year & Month": row.month_year ?? "-",
        "Billable Hours Delivered":
          row.total_billable_hours || row.total_billable_hours_month
            ? Number(
                row.total_billable_hours || row.total_billable_hours_month,
              ).toFixed(2)
            : "-",
        "Monthly Goal": row.monthly_target ?? row.monthly_goal ?? "-",
        "Pending Target": row.pending_target
          ? Number(row.pending_target).toFixed(2)
          : "-",
        "Avg. QC Score": row.avg_qc_score ?? "-",
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Report");
      XLSX.writeFile(workbook, `Monthly_Report.xlsx`);
      toast.success("Monthly report exported!");
    } catch {
      toast.error("Export failed");
    }
  };

  const handleExportDailyExcel = () => {
    try {
      const exportData: DailyExportRow[] = filteredDailyData.map((row) => ({
        "Date-Time": row.work_date
          ? dayjs(row.work_date).format("DD-MM-YYYY")
          : "-",
        "Assign Hours": "-",
        "Worked Hours":
          row.cumulative_billable_hours_till_day != null
            ? Number(row.cumulative_billable_hours_till_day).toFixed(2)
            : "-",
        "QC score": "-",
        "Daily Required Hours":
          row.daily_required_hours != null
            ? Number(row.daily_required_hours).toFixed(2)
            : "-",
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Report");
      XLSX.writeFile(workbook, `Daily_Report.xlsx`);
      toast.success("Daily report exported!");
    } catch {
      toast.error("Export failed");
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-gray-900">
            Performance Reports
          </h2>
          <p className="text-gray-500 font-medium">
            View and export your daily and monthly billable performance
            summaries.
          </p>
        </div>

        <div className="flex bg-white p-2 rounded-xl w-fit border border-gray-200">
          <Button
            variant={activeToggle === "daily" ? "default" : "ghost"}
            className={`px-4 h-11 rounded-lg font-semibold transition-all duration-300 ${activeToggle === "daily" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"}`}
            onClick={() => setActiveToggle("daily")}
          >
            <Clock className="w-4 h-4 mr-2" />
            Daily View
          </Button>
          <Button
            variant={activeToggle === "monthly" ? "default" : "ghost"}
            className={`px-4 h-11 rounded-lg font-semibold transition-all duration-300 ${activeToggle === "monthly" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"}`}
            onClick={() => setActiveToggle("monthly")}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Monthly View
          </Button>
        </div>
      </div>

      {/* Daily Report View */}
      {activeToggle === "daily" && (
        <Card className="shadow-sm border-gray-200 overflow-hidden rounded-xl min-h-125 bg-white">
          <CardHeader className="border-b border-gray-200 bg-gray-50 p-8">
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Daily Billable Hours
                  </CardTitle>
                  <CardDescription className="font-medium text-gray-500">
                    Breakdown of billable time per day
                  </CardDescription>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 w-full">
                <div className="flex flex-row items-center gap-4 bg-white p-2 rounded-xl border border-gray-200 shadow-sm w-auto">
                  <div className="flex items-center gap-2 px-2">
                    <span className="text-sm font-medium text-gray-700">
                      From
                    </span>
                    <Input
                      type="date"
                      className="w-full bg-gray-50 border-gray-200 focus:border-blue-400 transition-all rounded-lg"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 px-2 sm:border-l border-gray-200">
                    <span className="text-sm font-medium text-gray-700">
                      To
                    </span>
                    <Input
                      type="date"
                      className="w-full bg-gray-50 border-gray-200 focus:border-blue-400 transition-all rounded-lg"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 px-2 lg:border-l border-gray-200">
                    <span className="text-sm font-medium text-gray-700">
                      Month
                    </span>
                    <Input
                      type="month"
                      className="w-full bg-gray-50 border-gray-200 focus:border-blue-400 transition-all rounded-lg"
                      value={monthFilter}
                      onChange={(e) => setMonthFilter(e.target.value)}
                    />
                  </div>
                <div className="flex items-center gap-3 ml-auto lg:ml-0">
                  <Button
                    variant="outline"
                    className=" px-5 font-semibold text-gray-600 hover:bg-gray-50 rounded-lg border-gray-200"
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                      setMonthFilter("");
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="default"
                    className="bg-emerald-600 hover:bg-emerald-700 font-semibold gap-2 px-6 shadow-sm rounded-lg transition-all"
                    onClick={handleExportDailyExcel}
                  >
                    <FileDown className="w-4 h-4" />
                    Export
                  </Button>
                </div>
                </div>

              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loadingDaily ? (
              <Loading 
                title="Analyzing daily performance..." 
                description="Loading your billable hours and targets"
                fullHeight={false}
              />
            ) : errorDaily ? (
              <div className="p-8">
                <ErrorMessage
                  message={errorDaily}
                  onRetry={() => {
                    setStartDate("");
                    setEndDate("");
                    setMonthFilter("");
                  }}
                />
              </div>
            ) : (
              <DataTable
                columns={dailyColumns}
                data={filteredDailyData}
                loading={false}
                emptyMessage="No performance data found for this period."
                emptyIcon={Clock}
                showPagination={true}
                pageSize={10}
                containerClassName="border-0"
                headerClassName="bg-gray-50"
                rowClassName="group"
                rowHoverClassName="hover:bg-blue-50 transition-colors"
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Monthly Report View */}
      {activeToggle === "monthly" && (
        <Card className="shadow-sm border-gray-200 overflow-hidden rounded-xl min-h-125 bg-white">
          <CardHeader className="border-b border-gray-200 bg-gray-50 p-8">
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Monthly Summary
                  </CardTitle>
                  <CardDescription className="font-medium text-gray-500">
                    Aggregate monthly billable performance
                  </CardDescription>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 w-full">
                <div className="flex flex-row items-center gap-4 bg-white p-2 rounded-xl border border-gray-200 shadow-sm w-auto">
                  <div className="flex items-center gap-2 px-2">
                    <span className="text-sm font-medium text-gray-700">
                      Filter Month
                    </span>
                    <Input
                      type="month"
                      className="w-full bg-gray-50 border-gray-200 focus:border-blue-400 transition-all rounded-lg"
                      value={monthlyMonth}
                      onChange={(e) => setMonthlyMonth(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-auto lg:ml-0">
                  <Button
                    variant="outline"
                    className="px-5 font-semibold text-gray-600 hover:bg-gray-50 rounded-lg border-gray-200"
                    onClick={() => setMonthlyMonth("")}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="default"
                    className="bg-emerald-600 hover:bg-emerald-700 font-semibold gap-2 px-6 shadow-sm rounded-lg transition-all"
                    onClick={handleExportMonthlyTable}
                  >
                    <FileDown className="w-4 h-4" />
                    Export All
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loadingMonthly ? (
              <Loading 
                title="Generating monthly insights..." 
                description="Compiling your monthly performance summary"
                fullHeight={false}
              />
            ) : errorMonthly ? (
              <div className="p-8">
                <ErrorMessage
                  message={errorMonthly}
                  onRetry={() => setMonthlyMonth("")}
                />
              </div>
            ) : (
              <DataTable
                columns={monthlyColumns}
                data={monthlySummaryData}
                loading={false}
                emptyMessage="No monthly performance data available."
                emptyIcon={TrendingUp}
                showPagination={true}
                pageSize={10}
                containerClassName="border-0"
                headerClassName="bg-gray-50"
                rowClassName="group"
                rowHoverClassName="hover:bg-blue-50 transition-colors"
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AgentBillableReport;
