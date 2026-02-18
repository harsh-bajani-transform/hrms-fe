import * as XLSX from "xlsx";
import { toast } from "sonner";
import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import Loading from "@/components/common/Loading";
import {
  fetchMonthlyBillableReport,
  fetchDailyBillableReport,
} from "../../services/billableReportService";
import { fetchDropdown } from "../../../../services/dropdownService";
import { useAuth } from "../../../../context/AuthContext";
import MonthCard from "./MonthCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { TrackerRow } from "../../../dashboard/types";
import type { MonthlyBillableReportRow } from "../../services/billableReportService";

interface TeamOption {
  label: string;
  value: string;
}

type MonthObj = { label: string; year: string };

const MonthlyBillableReport: React.FC = () => {
  const { user } = useAuth();
  const isAgent = user?.role_id === 6 || user?.role_name === "agent";

  // State for monthly report API data, loading, and error
  const [monthlySummaryData, setMonthlySummaryData] = useState<
    MonthlyBillableReportRow[]
  >([]);
  const [loadingMonthly, setLoadingMonthly] = useState<boolean>(false);
  const [errorMonthly, setErrorMonthly] = useState<string | null>(null);
  const [monthlyMonth, setMonthlyMonth] = useState<string>(
    dayjs().format("YYYY-MM"),
  );

  const [teamOptions, setTeamOptions] = useState<TeamOption[]>([]);

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

  // Fetch monthly report data from API
  useEffect(() => {
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
  }, [monthlyMonth, user]);

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

  const handleExportUserDaily = async (userObj: {
    user_id: string | number;
    user_name: string;
  }) => {
    try {
      const payload: Record<string, unknown> = { user_id: userObj.user_id };
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
        payload.month_year = `${monthLabel}${year}`;
      }
      const res = await fetchDailyBillableReport({ ...payload });
      const trackers = Array.isArray(res.data?.trackers)
        ? res.data.trackers
        : [];

      const exportData = trackers.map((row: TrackerRow) => ({
        "Date-Time": row.work_date || row.date_time || row.date,
        "Assign Hours":
          row.tenure_target != null
            ? Number(row.tenure_target).toFixed(2)
            : "-",
        "Worked Hours":
          row.cumulative_billable_hours_till_day != null
            ? Number(row.cumulative_billable_hours_till_day).toFixed(2)
            : row.billable_hours != null
              ? Number(row.billable_hours).toFixed(2)
              : "-",
        "QC score":
          row.qc_score != null ? Number(row.qc_score).toFixed(2) : "-",
        "Daily Required Hours":
          row.daily_required_hours != null
            ? Number(row.daily_required_hours).toFixed(2)
            : "-",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "User Daily Report");
      XLSX.writeFile(workbook, `Daily_Report_${userObj.user_name}.xlsx`);
      toast.success("User daily report exported!");
    } catch {
      toast.error("Failed to export user daily report");
    }
  };

  const groupedMonthly = groupByMonthYear(monthlySummaryData);

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-5">
          Filters & Actions (Monthly)
        </h3>
        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-2 flex flex-col gap-3">
            <label className="block text-sm font-medium text-gray-700">
              Filter by Month
            </label>
            <div className="flex items-center gap-3">
              <Input
                type="month"
                className="border-gray-300"
                value={monthlyMonth}
                onChange={(e) => setMonthlyMonth(e.target.value)}
              />

              <Button
                variant="outline"
                className="px-6 border-gray-300"
                onClick={() => setMonthlyMonth("")}
              >
                Clear Filter
              </Button>
              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700 px-6"
                onClick={handleExportMonthlyTable}
              >
                Export All Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      {loadingMonthly ? (
        <Loading
          title="Loading monthly report..."
          description="Compiling monthly performance summary and statistics"
          fullHeight={false}
        />
      ) : errorMonthly ? (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 py-16 text-center">
          <p className="text-red-600 font-semibold">{errorMonthly}</p>
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
                onExport={(userRow) => {
                  handleExportUserDaily({
                    user_id: userRow.user_id as string,
                    user_name: userRow.user_name as string,
                  });
                }}
                onExportMonth={handleExportMonthData}
                teamOptions={teamOptions}
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 py-16 text-center">
          <p className="text-gray-500 text-lg">No monthly data available</p>
          <p className="text-gray-400 text-sm mt-2">
            Try selecting a different month
          </p>
        </div>
      )}
    </div>
  );
};

export default MonthlyBillableReport;
