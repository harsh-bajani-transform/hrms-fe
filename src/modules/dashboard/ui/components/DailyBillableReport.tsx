import * as XLSX from "xlsx";
import { toast } from "sonner";
import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);
import Loading from "@/components/common/Loading";
import { fetchDailyBillableReport } from "../../services/billableReportService";
import { fetchDropdown } from "../../../../services/dropdownService";
import { useAuth } from "../../../../context/AuthContext";
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

const DailyBillableReport: React.FC = () => {
  const { user } = useAuth();
  const isAgent = user?.role_id === 6 || user?.role_name === "agent";

  // State for date range filter
  const [startDate, setStartDate] = useState<string>(
    dayjs().startOf("month").format("YYYY-MM-DD"),
  );
  const [endDate, setEndDate] = useState<string>(
    dayjs().endOf("month").format("YYYY-MM-DD"),
  );
  const [monthFilter, setMonthFilter] = useState<string>(
    dayjs().format("YYYY-MM"),
  );

  const handleMonthFilterChange = (val: string) => {
    setMonthFilter(val);
    if (val) {
      const d = dayjs(val);
      setStartDate(d.startOf("month").format("YYYY-MM-DD"));
      setEndDate(d.endOf("month").format("YYYY-MM-DD"));
    }
  };

  // State for team filter (for non-agents)
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [teamOptions, setTeamOptions] = useState<TeamOption[]>([]);

  // State for API data, loading, and error
  const [dailyData, setDailyData] = useState<TrackerRow[]>([]);
  const [loadingDaily, setLoadingDaily] = useState<boolean>(false);
  const [errorDaily, setErrorDaily] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

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
  }, [startDate, endDate, monthFilter, user, refreshTrigger]);

  // Export all users' daily data (filtered by team if set)
  const handleExportAllUsers = () => {
    try {
      const exportRows = dailyData.filter((row) => {
        if (teamFilter && row.team_name !== teamFilter) return false;
        if (monthFilter) {
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
          "Assigned Hour":
            row.tenure_target != null
              ? Number(row.tenure_target).toFixed(2)
              : "-",
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
        { wch: 18 },
        { wch: 16 },
        { wch: 24 },
        { wch: 16 },
        { wch: 16 },
        { wch: 12 },
        { wch: 20 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Daily_Report");
      XLSX.writeFile(workbook, "All_Users_Daily_Report.xlsx");
      toast.success("Exported all users daily report!");
    } catch {
      toast.error("Failed to export all users");
    }
  };

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
          "Assign Hours":
            row.tenure_target != null
              ? Number(row.tenure_target).toFixed(2)
              : "-",
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

  const filteredDailyData =
    !isAgent && teamFilter
      ? dailyData.filter((item) => item.team_name === teamFilter)
      : dailyData;

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="bg-white rounded shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-5">
          Filters & Actions (Daily)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <Input
              type="date"
              className="border-gray-300"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <Input
              type="date"
              className="border-gray-300"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Filter by Month
            </label>
            <Input
              type="month"
              className="border-gray-300"
              value={monthFilter}
              onChange={(e) => handleMonthFilterChange(e.target.value)}
            />
          </div>

          {!isAgent && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Filter by Team
              </label>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="border-gray-300 w-full">
                  <SelectValue placeholder="All Teams" />
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
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
          <Button
            variant="default"
            className="bg-green-600 hover:bg-green-700 px-6"
            onClick={handleExportAllUsers}
          >
            Export All Data
          </Button>
          <Button
            variant="outline"
            className="px-6 border-gray-300"
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setMonthFilter("");
              setTeamFilter("");
            }}
          >
            Clear All Filters
          </Button>
        </div>
      </div>

      {loadingDaily ? (
        <Loading
          title="Loading daily report..."
          description="Fetching daily billable hours and performance data"
          fullHeight={false}
        />
      ) : errorDaily ? (
        <div className="bg-white rounded shadow-sm border border-red-200 py-16 text-center">
          <p className="text-red-600 font-semibold">{errorDaily}</p>
        </div>
      ) : filteredDailyData.length > 0 ? (
        <div className="space-y-4">
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
                  onRefresh={handleRefresh}
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
              onRefresh={handleRefresh}
            />
          )}
        </div>
      ) : (
        <div className="bg-white rounded shadow-sm border border-gray-200 py-16 text-center">
          <p className="text-gray-500 text-lg">
            No data available for selected filters
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Try adjusting your filter criteria
          </p>
        </div>
      )}
    </div>
  );
};

export default DailyBillableReport;
