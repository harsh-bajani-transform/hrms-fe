import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";
import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);
import {
  fetchDailyBillableReport,
  fetchMonthlyBillableReport,
} from "../../services/billableReportService";
import { fetchDropdown } from "../../../../services/dropdownService";
import { useAuth } from "../../../../context/AuthContext";
import MonthCard from "./MonthCard";
import UserCard from "./UserCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { TrackerRow } from "../../../dashboard/types";
import type { MonthlyBillableReportRow } from "../../services/billableReportService";

interface TeamOption {
  label: string;
  value: string;
}

interface UserObj {
  user_id: number | string;
  user_name: string;
  team_name: string;
  dailyData: TrackerRow[];
}

type MonthObj = { label: string; year: string };

type MonthlySummaryRow = MonthlyBillableReportRow;

const BillableReport: React.FC = () => {
  const { user } = useAuth();
  const isAgent = user?.role_id === 6 || user?.role_name === "agent";

  // State for tab toggle with localStorage persistence
  const [activeToggle, setActiveToggle] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("billable_active_tab") || "daily";
    }
    return "daily";
  });

  // Persist tab selection
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("billable_active_tab", activeToggle);
    }
  }, [activeToggle]);

  // State for date range filter
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState<string>("");

  // State for team filter (for non-agents)
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [teamOptions, setTeamOptions] = useState<TeamOption[]>([]);

  // State for API data, loading, and error
  const [dailyData, setDailyData] = useState<TrackerRow[]>([]);
  const [loadingDaily, setLoadingDaily] = useState<boolean>(false);
  const [errorDaily, setErrorDaily] = useState<string | null>(null);

  // State for monthly report API data, loading, and error
  const [monthlySummaryData, setMonthlySummaryData] = useState<
    MonthlyBillableReportRow[]
  >([]);
  const [loadingMonthly, setLoadingMonthly] = useState<boolean>(false);
  const [errorMonthly, setErrorMonthly] = useState<string | null>(null);
  const [monthlyMonth, setMonthlyMonth] = useState<string>("");

  // Fetch team options for dropdown (only for non-agents)
  useEffect(() => {
    if (isAgent) return;
    const fetchTeams = async () => {
      try {
        const teams = await fetchDropdown("teams");
        setTeamOptions(teams || []);
      } catch (err) {
        console.error("Failed to fetch teams:", err);
      }
    };
    fetchTeams();
  }, [isAgent]);

  // Fetch daily report data from API
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
        if (user?.user_id) {
          payload.logged_in_user_id = user.user_id;
        }
        const res = await fetchDailyBillableReport(payload);
        setDailyData(
          Array.isArray(res.data?.trackers) ? res.data.trackers : [],
        );
      } catch {
        setErrorDaily("Failed to fetch daily report data");
      } finally {
        setLoadingDaily(false);
      }
    };
    fetchData();
  }, [startDate, endDate, monthFilter, user]);

  // Fetch monthly report data from API
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
        if (user?.user_id) {
          payload.logged_in_user_id = user.user_id;
        }
        const res = await fetchMonthlyBillableReport(payload);
        setMonthlySummaryData(Array.isArray(res.data) ? res.data : []);
      } catch {
        setErrorMonthly("Failed to fetch monthly report data");
      } finally {
        setLoadingMonthly(false);
      }
    };
    fetchData();
  }, [activeToggle, monthlyMonth, user]);

  // Helper: Group monthly data by month-year
  const groupByMonthYear = (
    data: MonthlyBillableReportRow[],
  ): Record<string, MonthlyBillableReportRow[]> => {
    const grouped: Record<string, MonthlyBillableReportRow[]> = {};
    data.forEach((item) => {
      const key = item.month_year ?? "";
      if (!key) return;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key]?.push(item);
    });
    return grouped;
  };

  // Helper: Parse month-year string to get label and year
  const parseMonthYear = (monthYear: string): MonthObj => {
    const monthMap: Record<string, string> = {
      JAN: "January",
      FEB: "February",
      MAR: "March",
      APR: "April",
      MAY: "May",
      JUN: "June",
      JUL: "July",
      AUG: "August",
      SEP: "September",
      OCT: "October",
      NOV: "November",
      DEC: "December",
    };
    const monthPart = monthYear.slice(0, 3);
    const yearPart = monthYear.slice(3);
    return { label: monthMap[monthPart] || monthPart, year: yearPart };
  };

  // Export all users' daily data (filtered by team if set)
  const handleExportAllUsers = () => {
    try {
      // Filter daily data by team and month
      const exportRows = dailyData.filter((row) => {
        if (teamFilter && row.team_name !== teamFilter) return false;
        if (monthFilter) {
          // monthFilter is YYYY-MM
          const rowDate = row.work_date || row.date_time || row.date;
          if (!rowDate) return false;
          const d = dayjs(rowDate);
          if (!d.isValid()) return false;
          const monthStr = d.format("YYYY-MM");
          if (monthStr !== monthFilter) return false;
        }
        return true;
      });

      if (!exportRows.length) {
        toast.error("No data to export.");
        return;
      }

      // Prepare export data
      const exportData = exportRows.map((row) => {
        const workedHours =
          row.cumulative_billable_hours_till_day != null
            ? Number(row.cumulative_billable_hours_till_day).toFixed(2)
            : row.billable_hours
              ? Number(row.billable_hours).toFixed(2)
              : "-";

        const dailyRequired =
          row.daily_required_hours != null
            ? Number(row.daily_required_hours).toFixed(2)
            : row.tenure_target
              ? Number(row.tenure_target).toFixed(2)
              : "-";

        const formattedDate = row.work_date
          ? dayjs(row.work_date).format("DD-MM-YYYY")
          : row.date_time
            ? dayjs(row.date_time).format("DD-MM-YYYY")
            : "-";

        return {
          "User Name": row.user_name || "-",
          Team: row.team_name || "-",
          "Date-Time": formattedDate,
          "Assigned Hour": "-",
          "Worked Hours": workedHours,
          "QC Score":
            "qc_score" in row
              ? row.qc_score !== null
                ? Number(row.qc_score).toFixed(2)
                : "-"
              : "-",
          "Daily Required Hours": dailyRequired,
        };
      });

      // Add total row for countable columns
      if (exportData.length > 0) {
        const totalWorked = exportData.reduce(
          (sum, r) => sum + (Number.parseFloat(r["Worked Hours"]) || 0),
          0,
        );
        const totalQC = exportData.reduce(
          (sum, r) => sum + (Number.parseFloat(r["QC Score"]) || 0),
          0,
        );
        const totalRequired = exportData.reduce(
          (sum, r) => sum + (Number.parseFloat(r["Daily Required Hours"]) || 0),
          0,
        );

        exportData.push({
          "User Name": "Total",
          Team: "",
          "Date-Time": "",
          "Assigned Hour": "-",
          "Worked Hours": totalWorked.toFixed(2),
          "QC Score": totalQC.toFixed(2),
          "Daily Required Hours": totalRequired.toFixed(2),
        });
      }

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet["!cols"] = [
        { wch: 18 }, // User Name
        { wch: 16 }, // Team
        { wch: 24 }, // Date-Time
        { wch: 16 }, // Assigned Hour
        { wch: 16 }, // Worked Hours
        { wch: 12 }, // QC Score
        { wch: 20 }, // Daily Required Hours
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Daily_Report");
      XLSX.writeFile(workbook, "All_Users_Daily_Report.xlsx");
      toast.success("Exported all users daily report!");
    } catch {
      toast.error("Failed to export all users");
    }
  };

  // Export daily data for a specific user
  const handleExportUserDaily = async (userObj: UserObj) => {
    try {
      const payload: Record<string, unknown> = { user_id: userObj.user_id };
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
      }
      const res = await fetchDailyBillableReport(payload);
      const trackers: TrackerRow[] = Array.isArray(res.data?.trackers)
        ? res.data.trackers
        : [];
      const exportData = trackers.map((row) => {
        let formattedDateTime = "-";
        if (row.work_date) {
          const d = dayjs(row.work_date);
          if (d.isValid()) formattedDateTime = d.format("DD-MM-YYYY");
        } else if (row.date_time) {
          const d = dayjs(row.date_time);
          // Fallback to older format or just date
          formattedDateTime = d.isValid()
            ? d.format("DD-MM-YYYY")
            : row.date_time;
        }

        const workedHours =
          row.cumulative_billable_hours_till_day != null
            ? Number(row.cumulative_billable_hours_till_day).toFixed(2)
            : row.billable_hours
              ? Number(row.billable_hours).toFixed(2)
              : "-";

        const dailyRequired =
          row.daily_required_hours != null
            ? Number(row.daily_required_hours).toFixed(2)
            : row.tenure_target
              ? Number(row.tenure_target).toFixed(2)
              : "-";

        return {
          "Date-Time": formattedDateTime,
          "Assign Hours": "-",
          "Worked Hours": workedHours,
          "QC score":
            "qc_score" in row
              ? row.qc_score !== null
                ? Number(row.qc_score).toFixed(2)
                : "-"
              : "-",
          "Daily Required Hours": dailyRequired,
        };
      });
      const totalWorked = exportData.reduce(
        (sum, r) => sum + (Number(r["Worked Hours"]) || 0),
        0,
      );
      const totalRequired = exportData.reduce(
        (sum, r) => sum + (Number(r["Daily Required Hours"]) || 0),
        0,
      );
      const qcScores = exportData
        .map((r) => Number(r["QC score"]))
        .filter((v) => !isNaN(v));
      const avgQC =
        qcScores.length > 0
          ? (qcScores.reduce((a, b) => a + b, 0) / qcScores.length).toFixed(2)
          : "-";
      exportData.push({
        "Date-Time": "TOTAL",
        "Assign Hours": "-",
        "Worked Hours": totalWorked.toFixed(2),
        "QC score": avgQC,
        "Daily Required Hours": totalRequired.toFixed(2),
      });
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet["!cols"] = [
        { wch: 20 },
        { wch: 14 },
        { wch: 14 },
        { wch: 10 },
        { wch: 20 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "User Daily Report");
      const filename = `User_Daily_Report_${userObj.user_name}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success("User daily report exported!");
    } catch {
      toast.error("Failed to export user daily report");
    }
  };

  // Export entire month data for a specific month
  const handleExportMonthData = async (
    monthObj: MonthObj,
    users: MonthlyBillableReportRow[],
  ) => {
    try {
      const exportData = users.map((u) => ({
        "User Name / Team": `${u.user_name ?? ""}${u.team_name ? ` / ${u.team_name}` : ""}`,
        "Billable Hour Delivered": u.total_billable_hours
          ? Number(u.total_billable_hours).toFixed(2)
          : "-",
        "Monthly Goal": u.monthly_target ?? "-",
        "Pending Target": u.pending_target
          ? Number(u.pending_target).toFixed(2)
          : "-",
        "Avg. QC Score": u.avg_qc_score
          ? Number(u.avg_qc_score).toFixed(2)
          : "-",
      }));
      const totalBillable = exportData.reduce(
        (sum, r) => sum + (Number(r["Billable Hour Delivered"]) || 0),
        0,
      );
      const totalGoal = exportData.reduce(
        (sum, r) => sum + (Number(r["Monthly Goal"]) || 0),
        0,
      );
      const totalPending = exportData.reduce(
        (sum, r) => sum + (Number(r["Pending Target"]) || 0),
        0,
      );
      const qcScores = exportData
        .map((r) => Number(r["Avg. QC Score"]))
        .filter((v) => !isNaN(v));
      const avgQC =
        qcScores.length > 0
          ? (qcScores.reduce((a, b) => a + b, 0) / qcScores.length).toFixed(2)
          : "-";
      exportData.push({
        "User Name / Team": "TOTAL",
        "Billable Hour Delivered": totalBillable.toString(),
        "Monthly Goal": totalGoal,
        "Pending Target": totalPending.toString(),
        "Avg. QC Score": avgQC,
      });
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet["!cols"] = [
        { wch: 24 },
        { wch: 24 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Month Report");
      const filename = `Month_Report_${monthObj.label}_${monthObj.year}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success("Month report exported!");
    } catch {
      toast.error("Failed to export month report");
    }
  };

  // Export the entire monthly summary table
  const handleExportMonthlyTable = () => {
    try {
      const exportData = monthlySummaryData.map((row) => ({
        "Year & Month": row.month_year,
        "Billable Hours Delivered": row.total_billable_hours
          ? Number(row.total_billable_hours).toFixed(2)
          : row.total_billable_hours_month
            ? Number(row.total_billable_hours_month).toFixed(2)
            : "-",
        "Monthly Goal": row.monthly_target ?? row.monthly_goal,
        "Pending Target": row.pending_target
          ? Number(row.pending_target).toFixed(2)
          : "-",
        "Avg. QC Score": row.avg_qc_score ?? "-",
      }));
      const totalBillable = exportData.reduce(
        (sum, r) => sum + (Number(r["Billable Hours Delivered"]) || 0),
        0,
      );
      const totalGoal = exportData.reduce(
        (sum, r) => sum + (Number(r["Monthly Goal"]) || 0),
        0,
      );
      const totalPending = exportData.reduce(
        (sum, r) => sum + (Number(r["Pending Target"]) || 0),
        0,
      );
      const qcScores = exportData
        .map((r) => Number(r["Avg. QC Score"]))
        .filter((v) => !isNaN(v));
      const avgQC =
        qcScores.length > 0
          ? (qcScores.reduce((a, b) => a + b, 0) / qcScores.length).toFixed(2)
          : "-";
      exportData.push({
        "Year & Month": "TOTAL",
        "Billable Hours Delivered": totalBillable.toString(),
        "Monthly Goal": totalGoal,
        "Pending Target": totalPending.toString(),
        "Avg. QC Score": avgQC,
      });
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet["!cols"] = [
        { wch: 16 },
        { wch: 24 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Report");
      const filename = `Monthly_Report.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success("Monthly report exported!");
    } catch {
      toast.error("Failed to export monthly report");
    }
  };

  // Filter daily data by team (for non-agents)
  const filteredDailyData =
    !isAgent && teamFilter
      ? dailyData.filter((item) => item.team_name === teamFilter)
      : dailyData;

  // Group monthly data by month-year
  const groupedMonthly = groupByMonthYear(monthlySummaryData);

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant={activeToggle === "daily" ? "default" : "outline"}
          className={`px-6 ${activeToggle === "daily" ? "" : "text-blue-600 border-blue-200 hover:bg-blue-50"}`}
          onClick={() => setActiveToggle("daily")}
        >
          Daily Report
        </Button>
        <Button
          variant={activeToggle === "monthly" ? "default" : "outline"}
          className={`px-6 ${activeToggle === "monthly" ? "" : "text-blue-600 border-blue-200 hover:bg-blue-50"}`}
          onClick={() => setActiveToggle("monthly")}
        >
          Monthly Report
        </Button>
      </div>

      {activeToggle === "daily" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-slate-700">
                Date Range:
              </span>
              <Input
                type="date"
                className="h-9 w-40"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="text-slate-500">to</span>
              <Input
                type="date"
                className="h-9 w-40"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <span className="text-sm font-semibold text-slate-700 ml-4">
                Month:
              </span>
              <Input
                type="month"
                className="h-9 w-36"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
              />
              {!isAgent && (
                <>
                  <span className="text-sm font-semibold text-slate-700 ml-4">
                    Team:
                  </span>
                  <Select value={teamFilter} onValueChange={setTeamFilter}>
                    <SelectTrigger className="h-9 w-48">
                      <SelectValue placeholder="Select Team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">All Teams</SelectItem>
                      {teamOptions.map((t) => (
                        <SelectItem key={t.label} value={t.label}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              <Button
                variant="default"
                size="sm"
                className="bg-green-600 hover:bg-green-700 h-9 px-4"
                onClick={handleExportAllUsers}
              >
                Export All
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setMonthFilter("");
                  setTeamFilter("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {loadingDaily ? (
            <div className="py-12 text-center text-blue-700 font-semibold">
              Loading daily report...
            </div>
          ) : errorDaily ? (
            <div className="py-12 text-center text-red-600 font-semibold">
              {errorDaily}
            </div>
          ) : filteredDailyData.length > 0 ? (
            <div className="space-y-4">
              {/* Group by user if not agent */}
              {!isAgent ? (
                (() => {
                  const userMap: Record<string, UserObj> = {};
                  filteredDailyData.forEach((item) => {
                    if (item.user_id === undefined) return;
                    const userId = String(item.user_id);
                    if (!userMap[userId]) {
                      userMap[userId] = {
                        user_id: item.user_id,
                        user_name: item.user_name ?? "",
                        team_name: item.team_name ?? "",
                        dailyData: [],
                      };
                    }
                    userMap[userId]?.dailyData.push(item);
                  });
                  return Object.values(userMap).map((userObj) => (
                    <UserCard
                      key={userObj.user_id}
                      user={userObj}
                      dailyData={userObj.dailyData}
                      defaultCollapsed={true}
                      onExport={() => handleExportUserDaily(userObj)}
                    />
                  ));
                })()
              ) : (
                <UserCard
                  user={{
                    user_id: user?.user_id ?? "",
                    user_name: user?.user_name ?? "",
                    team_name:
                      typeof user?.team_name === "string" ? user.team_name : "",
                  }}
                  dailyData={filteredDailyData}
                  defaultCollapsed={false}
                />
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400">
              No data available
            </div>
          )}
        </div>
      )}

      {activeToggle === "monthly" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <label className="font-semibold text-blue-700">Month:</label>
            <Input
              type="month"
              className="h-9 w-36"
              value={monthlyMonth}
              onChange={(e) => setMonthlyMonth(e.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3"
              onClick={() => setMonthlyMonth("")}
            >
              Clear Filters
            </Button>
            <div className="flex-1" />
            <Button
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700 h-9 px-4"
              onClick={handleExportMonthlyTable}
            >
              Export All
            </Button>
          </div>

          {loadingMonthly ? (
            <div className="py-12 text-center text-blue-700 font-semibold">
              Loading monthly report...
            </div>
          ) : errorMonthly ? (
            <div className="py-12 text-center text-red-600 font-semibold">
              {errorMonthly}
            </div>
          ) : Object.keys(groupedMonthly).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(groupedMonthly).map(([monthYear, users]) => {
                const monthObj = parseMonthYear(monthYear);
                return (
                  <MonthCard
                    key={monthYear}
                    month={monthObj}
                    users={users}
                    onExport={() => {}}
                    onExportMonth={handleExportMonthData}
                    teamOptions={teamOptions}
                  />
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400">
              No data available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BillableReport;
