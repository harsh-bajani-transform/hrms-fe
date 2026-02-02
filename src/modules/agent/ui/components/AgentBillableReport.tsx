import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

import { getFriendlyErrorMessage } from "../../../../utils/errorMessages";
import ErrorMessage from "../../../../components/common/ErrorMessage";
import {
  fetchDailyBillableReport,
  fetchMonthlyBillableReport,
} from "../../../dashboard/services/billableReportService";
import { useAuth } from "../../../../context/AuthContext";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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

  const handleExportMonthDailyExcel = async (monthYear: string) => {
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
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Performance Reports
          </h2>
          <p className="text-slate-500 font-medium">
            View and export your daily and monthly billable performance
            summaries.
          </p>
        </div>

        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl w-fit shadow-inner border border-slate-200">
          <Button
            variant={activeToggle === "daily" ? "default" : "ghost"}
            className={`px-8 h-10 rounded-xl font-black transition-all duration-300 ${activeToggle === "daily" ? "bg-blue-600 text-white shadow-lg border-none" : "text-slate-500 hover:text-blue-600"}`}
            onClick={() => setActiveToggle("daily")}
          >
            <Clock className="w-4.5 h-4.5 mr-2" />
            Daily View
          </Button>
          <Button
            variant={activeToggle === "monthly" ? "default" : "ghost"}
            className={`px-8 h-10 rounded-xl font-black transition-all duration-300 ${activeToggle === "monthly" ? "bg-blue-600 text-white shadow-lg border-none" : "text-slate-500 hover:text-blue-600"}`}
            onClick={() => setActiveToggle("monthly")}
          >
            <BarChart3 className="w-4.5 h-4.5 mr-2" />
            Monthly View
          </Button>
        </div>
      </div>

      {/* Daily Report View */}
      {activeToggle === "daily" && (
        <Card className="border-none shadow-2xl overflow-hidden rounded-3xl min-h-[500px] bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/40 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black text-slate-900">
                    Daily Billable Hours
                  </CardTitle>
                  <CardDescription className="font-medium text-slate-500">
                    Breakdown of billable time per day
                  </CardDescription>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 px-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest lb-1">
                      From
                    </span>
                    <Input
                      type="date"
                      className="h-10 w-40 bg-slate-50/50 border-slate-100 focus:bg-white transition-all font-bold rounded-xl"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 px-2 sm:border-l border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest lb-1">
                      To
                    </span>
                    <Input
                      type="date"
                      className="h-10 w-40 bg-slate-50/50 border-slate-100 focus:bg-white transition-all font-bold rounded-xl"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 px-2 lg:border-l border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest lb-1">
                      Month
                    </span>
                    <Input
                      type="month"
                      className="h-10 w-40 bg-slate-50/50 border-slate-100 focus:bg-white transition-all font-bold rounded-xl"
                      value={monthFilter}
                      onChange={(e) => setMonthFilter(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-auto lg:ml-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 px-5 font-black text-slate-500 hover:bg-slate-50 rounded-xl"
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
                    className="bg-emerald-600 hover:bg-emerald-700 font-black gap-2 h-10 px-6 shadow-lg shadow-emerald-100 rounded-xl transition-all active:scale-95"
                    onClick={handleExportDailyExcel}
                  >
                    <FileDown className="w-4.5 h-4.5" />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loadingDaily ? (
              <div className="py-32 text-center">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-medium">
                  Analyzing daily performance...
                </p>
              </div>
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
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-6 font-bold text-slate-900 h-12">
                      Date
                    </TableHead>
                    <TableHead className="text-center font-bold text-slate-900 h-12">
                      Assigned (Hrs)
                    </TableHead>
                    <TableHead className="text-center font-bold text-slate-900 h-12">
                      Worked (Hrs)
                    </TableHead>
                    <TableHead className="text-center font-bold text-slate-900 h-12">
                      QC Score
                    </TableHead>
                    <TableHead className="text-center font-bold text-slate-900 h-12">
                      Daily Target (Hrs)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDailyData.length > 0 ? (
                    filteredDailyData.map((row, idx) => (
                      <TableRow
                        key={idx}
                        className="group hover:bg-slate-50/50 transition-colors border-slate-100"
                      >
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {row.work_date
                            ? dayjs(row.work_date).format("DD-MM-YYYY")
                            : row.date_time
                              ? dayjs(row.date_time).format("DD-MM-YYYY")
                              : "-"}
                        </td>
                        <td className="px-6 py-4 text-center text-slate-400 font-mediumitalic">
                          —
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge className="bg-blue-50! text-blue-700! border-blue-100! font-bold text-sm">
                            {row.cumulative_billable_hours_till_day != null
                              ? Number(
                                  row.cumulative_billable_hours_till_day,
                                ).toFixed(2)
                              : "-"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center text-slate-400 font-mediumitalic">
                          —
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge
                            variant="outline"
                            className="font-bold border-slate-200 text-slate-600"
                          >
                            {row.daily_required_hours != null
                              ? Number(row.daily_required_hours).toFixed(2)
                              : "-"}
                          </Badge>
                        </td>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-3 text-slate-300">
                          <Clock className="w-12 h-12 opacity-20" />
                          <p className="text-slate-400 font-medium">
                            No performance data found for this period.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Monthly Report View */}
      {activeToggle === "monthly" && (
        <Card className="border-slate-200 shadow-xl overflow-hidden min-h-[500px]">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">
                    Monthly Summary
                  </CardTitle>
                  <CardDescription>
                    Aggregate monthly billable performance
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                    Filter Month
                  </span>
                  <Input
                    type="month"
                    className="h-9 w-40 bg-white border-slate-200"
                    value={monthlyMonth}
                    onChange={(e) => setMonthlyMonth(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 font-bold text-slate-500"
                  onClick={() => setMonthlyMonth("")}
                >
                  Reset
                </Button>
                <Button
                  variant="default"
                  className="bg-emerald-600 hover:bg-emerald-700 font-bold gap-2 h-9 shadow-md"
                  onClick={handleExportMonthlyTable}
                >
                  <FileDown className="w-4 h-4" />
                  Export All
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loadingMonthly ? (
              <div className="py-32 text-center">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-medium">
                  Generating monthly insights...
                </p>
              </div>
            ) : errorMonthly ? (
              <div className="p-8">
                <ErrorMessage
                  message={errorMonthly}
                  onRetry={() => setMonthlyMonth("")}
                />
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-6 font-bold text-slate-900 h-12">
                      Year & Month
                    </TableHead>
                    <TableHead className="text-center font-bold text-slate-900 h-12">
                      Hours Delivered
                    </TableHead>
                    <TableHead className="text-center font-bold text-slate-900 h-12">
                      Monthly Goal
                    </TableHead>
                    <TableHead className="text-center font-bold text-slate-900 h-12">
                      Pending
                    </TableHead>
                    <TableHead className="text-center font-bold text-slate-900 h-12">
                      Avg QC Score
                    </TableHead>
                    <TableHead className="text-right pr-6 font-bold text-slate-900 h-12">
                      Full Report
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlySummaryData.length > 0 ? (
                    monthlySummaryData.map((row, idx) => (
                      <TableRow
                        key={idx}
                        className="group hover:bg-slate-50/50 transition-colors border-slate-100"
                      >
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {row.month_year}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge className="bg-blue-50! text-blue-700! border-blue-100! font-bold text-sm">
                            {row.total_billable_hours ||
                            row.total_billable_hours_month
                              ? Number(
                                  row.total_billable_hours ||
                                    row.total_billable_hours_month,
                                ).toFixed(2)
                              : "-"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-600">
                          {row.monthly_target ?? row.monthly_goal ?? "-"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge
                            variant="outline"
                            className={`font-bold border-slate-200 ${Number(row.pending_target) > 0 ? "text-amber-600 bg-amber-50" : "text-emerald-600 bg-emerald-50"}`}
                          >
                            {row.pending_target
                              ? Number(row.pending_target).toFixed(2)
                              : "-"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {row.avg_qc_score != null ? (
                            <Badge
                              variant="secondary"
                              className="bg-slate-100 text-slate-900 font-bold border-none"
                            >
                              {row.avg_qc_score}
                            </Badge>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right pr-6">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold gap-2"
                            onClick={() =>
                              row.month_year &&
                              void handleExportMonthDailyExcel(row.month_year)
                            }
                          >
                            <Download className="w-3.5 h-3.5" />
                            Excel
                          </Button>
                        </td>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-3 text-slate-300">
                          <TrendingUp className="w-12 h-12 opacity-20" />
                          <p className="text-slate-400 font-medium">
                            No monthly performance data available.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AgentBillableReport;
