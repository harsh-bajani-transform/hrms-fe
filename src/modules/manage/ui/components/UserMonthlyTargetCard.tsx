import React, { useState, useMemo, useEffect, useCallback } from "react";
import { exportToCSV } from "../../../../lib/utils/exportUtils";
import dayjs, { Dayjs } from "dayjs";
import { Download, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DataTable } from "@/components/ui/data-table";
import { createColumns, type Agent } from "./UserMonthlyTargetCardColumns";
import { useAuth } from "../../../../context/AuthContext";
import {
  fetchMonthlyBillableReport,
  type MonthlyBillableReportRow,
} from "../../../dashboard/services/billableReportService";
import Loading from "@/components/common/Loading";

interface MonthData {
  key: string;
  label: string;
  range: [Dayjs, Dayjs];
  agents: Agent[];
}

// Hardcoded data removed

const UserMonthlyTargetCard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [monthsData, setMonthsData] = useState<MonthData[]>([]);

  // Generate last 3 months
  const generateMonths = () => {
    const months: MonthData[] = [];
    for (let i = 0; i < 3; i++) {
      const d = dayjs().subtract(i, "month");
      months.push({
        key: d.format("YYYY-MM"),
        label: d.format("MMM YYYY").toUpperCase(),
        range: [d.startOf("month"), d.endOf("month")],
        agents: [],
      });
    }
    return months;
  };

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [dateRanges, setDateRanges] = useState<Record<string, [Dayjs, Dayjs]>>(
    {},
  );

  const handleEditTarget = (agent: Agent) => {
    toast.info(`Edit target for ${agent.userName}`);
    // Implement edit modal or logic here
  };

  const handleDeleteAgent = (agent: Agent) => {
    toast.info(`Delete agent ${agent.userName}`);
    // Implement delete confirmation or logic here
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const months = generateMonths();
      const initialDateRanges: Record<string, [Dayjs, Dayjs]> = {};
      const initialExpanded: Record<string, boolean> = {};

      const updatedMonths = await Promise.all(
        months.map(async (m) => {
          initialDateRanges[m.key] = m.range;
          initialExpanded[m.key] = m.key === dayjs().format("YYYY-MM"); // Only expand current month

          const [year, month] = m.key.split("-");
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
          const payload = {
            month_year: `${monthLabel}${year}`,
            logged_in_user_id: user?.user_id,
          };

          const res = await fetchMonthlyBillableReport(payload);
          const apiAgents: Agent[] = (
            Array.isArray(res.data) ? res.data : []
          ).map((row: MonthlyBillableReportRow) => ({
            id: Number(row.user_id || 0),
            userName: row.user_name || "Unknown",
            team: row.team_name || (row.team as string) || "N/A",
            workingDays: Number(row.working_days || 0),
            extraAssignHours: Number(
              row.extra_assigned_hours || row.extra_assign_hours || 0,
            ),
            monthlyTarget: Number(row.monthly_target || row.monthly_goal || 0),
            monthlyAchievedTarget: Number(
              row.total_billable_hours || row.total_billable_hours_month || 0,
            ),
          }));

          return { ...m, agents: apiAgents };
        }),
      );

      setMonthsData(updatedMonths);
      setDateRanges(initialDateRanges);
      setExpanded(initialExpanded);
    } catch (err) {
      toast.error("Failed to fetch monthly targets");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRangeChange = (key: string, range: [Dayjs, Dayjs]) => {
    setDateRanges((prev) => ({ ...prev, [key]: range }));
  };

  const handleExportCSV = (monthLabel: string) => {
    const monthData = monthsData.find((m) => m.label === monthLabel);
    if (!monthData || monthData.agents.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData: Record<string, unknown>[] = monthData.agents.map((agent) => ({
      "User Name": agent.userName,
      Team: agent.team,
      "Monthly Target": agent.monthlyTarget,
      "Extra Assign Hours": agent.extraAssignHours,
      "Working Days": agent.workingDays,
    }));

    exportToCSV(exportData, `Monthly_Target_${monthLabel}.csv`);
    toast.success(`Exported ${monthLabel} data to CSV!`);
  };

  // Create columns
  const columns = useMemo(
    () => createColumns(handleEditTarget, handleDeleteAgent),
    [],
  );

  if (loading && monthsData.length === 0) {
    return (
      <Loading
        title="Loading monthly targets..."
        description="Compiling monthly performance summary and statistics"
        fullHeight={false}
      />
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="mb-2 ">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <User className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">User Monthly Targets</h2>
            <p className="text-slate-600 mt-1 font-medium">
              Review and manage monthly production goals for agents.
            </p>
          </div>
        </div>
      </div>
      <Accordion
        type="multiple"
        value={Object.entries(expanded)
          .filter(([_, v]) => v)
          .map(([k]) => k)}
        onValueChange={(val) => {
          const newState: Record<string, boolean> = {};
          monthsData.forEach((m) => {
            newState[m.key] = val.includes(m.key);
          });
          setExpanded(newState);
        }}
        className="space-y-6"
      >
        {monthsData.map((month) => (
          <AccordionItem
            key={month.key}
            value={month.key}
            className="bg-white rounded border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 border-none"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg text-slate-800 tracking-tight">
                  {month.label}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-slate-500 uppercase">
                    <span>From</span>
                    <Input
                      className=" w-28 bg-transparent border-none p-0 text-slate-700 font-semibold cursor-pointer shadow-none"
                      type="date"
                      value={(
                        dateRanges[month.key]?.[0] ?? month.range[0]
                      ).format("YYYY-MM-DD")}
                      min={month.range[0].format("YYYY-MM-DD")}
                      max={month.range[1].format("YYYY-MM-DD")}
                      onChange={(e) =>
                        handleRangeChange(month.key, [
                          dayjs(e.target.value),
                          dateRanges[month.key]?.[1] ?? month.range[1],
                        ])
                      }
                    />
                  </div>
                  <div className="w-px h-4 bg-slate-200" />
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-slate-500 uppercase">
                    <span>To</span>
                    <Input
                      className="w-28 bg-transparent border-none p-0 text-slate-700 font-semibold cursor-pointer shadow-none"
                      type="date"
                      value={(
                        dateRanges[month.key]?.[1] ?? month.range[1]
                      ).format("YYYY-MM-DD")}
                      min={month.range[0].format("YYYY-MM-DD")}
                      max={month.range[1].format("YYYY-MM-DD")}
                      onChange={(e) =>
                        handleRangeChange(month.key, [
                          dateRanges[month.key]?.[0] ?? month.range[0],
                          dayjs(e.target.value),
                        ])
                      }
                    />
                  </div>
                </div>
                <Button
                  variant="default"
                  onClick={() => handleExportCSV(month.label)}
                  className="bg-emerald-600 hover:bg-emerald-700 px-4 font-bold"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </Button>
                <AccordionTrigger className="p-2 rounded-full hover:bg-slate-200 transition-all text-slate-500 hover:no-underline" />
              </div>
            </div>
            <AccordionContent className="p-0 pt-0">
              <DataTable
                columns={columns}
                data={month.agents}
                emptyMessage="No agents available"
                emptyIcon={User}
                showPagination={true}
                pageSize={10}
                headerClassName="bg-slate-50"
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default UserMonthlyTargetCard;
