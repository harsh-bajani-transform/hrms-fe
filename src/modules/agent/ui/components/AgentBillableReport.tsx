import { useEffect, useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
} from "@tanstack/react-table";
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
import { DataTablePagination } from "@/components/ui/pagination";
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

const dailyColumnHelper = createColumnHelper<TrackerRow>();
const monthlyColumnHelper = createColumnHelper<MonthlyBillableReportRow>();

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

  // Daily table columns
  const dailyColumns = useMemo<ColumnDef<TrackerRow, unknown>[]>(
    () => [
      dailyColumnHelper.accessor((row) => row.work_date, {
        id: 'work_date',
        header: 'Date',
        cell: (info) => (
          <div className="px-6 py-4 font-medium text-gray-900">
            {info.getValue()
              ? dayjs(info.getValue() as string).format("DD-MM-YYYY")
              : info.row.original.date_time
                ? dayjs(info.row.original.date_time).format("DD-MM-YYYY")
                : "-"}
          </div>
        ),
      }) as ColumnDef<TrackerRow, unknown>,
      dailyColumnHelper.display({
        id: 'assigned_hours',
        header: () => <div className="text-center">Assigned (Hrs)</div>,
        cell: () => (
          <div className="px-6 py-4 text-center text-gray-400 font-medium italic">
            —
          </div>
        ),
      }),
      dailyColumnHelper.accessor((row) => row.cumulative_billable_hours_till_day as unknown, {
        id: 'cumulative_billable_hours_till_day',
        header: () => <div className="text-center">Worked (Hrs)</div>,
        cell: (info) => (
          <div className="px-6 py-4 text-center">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-semibold text-sm">
              {info.getValue() != null
                ? Number(info.getValue()).toFixed(2)
                : "-"}
            </Badge>
          </div>
        ),
      }) as ColumnDef<TrackerRow, unknown>,
      dailyColumnHelper.display({
        id: 'qc_score',
        header: () => <div className="text-center">QC Score</div>,
        cell: () => (
          <div className="px-6 py-4 text-center text-gray-400 font-medium italic">
            —
          </div>
        ),
      }),
      dailyColumnHelper.accessor((row) => row.daily_required_hours as unknown, {
        id: 'daily_required_hours',
        header: () => <div className="text-center">Daily Target (Hrs)</div>,
        cell: (info) => (
          <div className="px-6 py-4 text-center">
            <Badge
              variant="outline"
              className="font-semibold text-gray-700 border-gray-300"
            >
              {info.getValue() != null ? Number(info.getValue()).toFixed(2) : "-"}
            </Badge>
          </div>
        ),
      }) as ColumnDef<TrackerRow, unknown>,
    ],
    [],
  );

  // Initialize daily table
  const dailyTable = useReactTable({
    data: filteredDailyData,
    columns: dailyColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Monthly table columns
  const monthlyColumns = useMemo(
    () => [
      monthlyColumnHelper.accessor((row) => row.month_year, {
        id: 'month_year',
        header: 'Month & Year',
        cell: (info) => (
          <div className="px-6 py-4 font-semibold text-gray-900">
            {info.getValue() ?? "-"}
          </div>
        ),
      }) as ColumnDef<MonthlyBillableReportRow, unknown>,
      monthlyColumnHelper.display({
        id: 'billable_hours',
        header: () => <div className="text-center">Billable Hours</div>,
        cell: (info) => {
          const row = info.row.original;
          const value = row.total_billable_hours || row.total_billable_hours_month;
          return (
            <div className="px-6 py-4 text-center">
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-semibold">
                {value ? Number(value).toFixed(2) : "-"}
              </Badge>
            </div>
          );
        },
      }),
      monthlyColumnHelper.display({
        id: 'monthly_goal',
        header: () => <div className="text-center">Monthly Goal</div>,
        cell: (info) => {
          const row = info.row.original;
          const goal = row.monthly_target ?? row.monthly_goal;
          return (
            <div className="px-6 py-4 text-center">
              <Badge
                variant="outline"
                className="font-semibold border-gray-300 text-gray-700"
              >
                {goal ?? "-"}
              </Badge>
            </div>
          );
        },
      }),
      monthlyColumnHelper.accessor((row) => row.pending_target as unknown, {
        id: 'pending_target',
        header: () => <div className="text-center">Pending Target</div>,
        cell: (info) => {
          const value = info.row.original.pending_target;
          return (
            <div className="px-6 py-4 text-center">
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-semibold">
                {value ? Number(value).toFixed(2) : "-"}
              </Badge>
            </div>
          );
        },
      }) as ColumnDef<MonthlyBillableReportRow, unknown>,
      monthlyColumnHelper.accessor((row) => row.avg_qc_score as unknown, {
        id: 'avg_qc_score',
        header: () => <div className="text-center">Avg. QC Score</div>,
        cell: (info) => (
          <div className="px-6 py-4 text-center text-gray-400 font-medium italic">
            {info.row.original.avg_qc_score ?? "—"}
          </div>
        ),
      }) as ColumnDef<MonthlyBillableReportRow, unknown>,
    ],
    [],
  );

  // Initialize monthly table
  const monthlyTable = useReactTable({
    data: monthlySummaryData,
    columns: monthlyColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

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
              <div className="py-32 text-center">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-medium">
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
              <>
                <Table>
                  <TableHeader className="bg-gray-50">
                    {dailyTable.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="hover:bg-transparent">
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id} className="px-6 font-semibold text-gray-700 h-12">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {dailyTable.getRowModel().rows.length > 0 ? (
                      dailyTable.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="group hover:bg-blue-50 transition-colors border-gray-200"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="p-0">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-64 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <Clock className="w-12 h-12 text-gray-300" />
                            <p className="text-gray-500 font-medium">
                              No performance data found for this period.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Daily Pagination */}
                {filteredDailyData.length > 0 && (
                  <DataTablePagination table={dailyTable} />
                )}
              </>
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
                    size="sm"
                    className="h-11 px-5 font-semibold text-gray-600 hover:bg-gray-50 rounded-lg border-gray-200"
                    onClick={() => setMonthlyMonth("")}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="default"
                    className="bg-emerald-600 hover:bg-emerald-700 font-semibold gap-2 h-11 px-6 shadow-sm rounded-lg transition-all"
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
              <div className="py-32 text-center">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-medium">
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
              <>
                <Table>
                  <TableHeader className="bg-gray-50">
                    {monthlyTable.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="hover:bg-transparent">
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id} className="px-6 font-semibold text-gray-700 h-12">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
                        <TableHead className="text-right pr-6 font-semibold text-gray-700 h-12">
                          Full Report
                        </TableHead>
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {monthlyTable.getRowModel().rows.length > 0 ? (
                      monthlyTable.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="group hover:bg-blue-50 transition-colors border-gray-200"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="p-0">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          ))}
                          <td className="px-6 py-4 text-right pr-6">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-11 border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold gap-2 rounded-lg"
                              onClick={() =>
                                row.original.month_year &&
                                void handleExportMonthDailyExcel(row.original.month_year)
                              }
                            >
                              <Download className="w-4 h-4" />
                              Excel
                            </Button>
                          </td>
                        </TableRow>
                      ))
                    ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <TrendingUp className="w-12 h-12 text-gray-300" />
                          <p className="text-gray-500 font-medium">
                            No monthly performance data available.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Monthly Pagination */}
              {monthlySummaryData.length > 0 && (
                <DataTablePagination table={monthlyTable} />
              )}
            </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AgentBillableReport;
