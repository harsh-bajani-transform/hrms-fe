import dayjs from "dayjs";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { TrackerRow } from "../../../dashboard/types";
import type { MonthlyBillableReportRow } from "../../../dashboard/services/billableReportService";

const dailyColumnHelper = createColumnHelper<TrackerRow>();
const monthlyColumnHelper = createColumnHelper<MonthlyBillableReportRow>();

export function createDailyColumns(): ColumnDef<TrackerRow, unknown>[] {
  return [
    dailyColumnHelper.accessor((row) => row.work_date, {
      id: "work_date",
      header: "Date",
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
      id: "assigned_hours",
      header: () => <div className="text-center">Assigned (Hrs)</div>,
      cell: (info) => (
        <div className="px-6 py-4 text-center text-gray-900 font-medium">
          {info.row.original.tenure_target != null
            ? Number(info.row.original.tenure_target).toFixed(2)
            : "—"}
        </div>
      ),
    }),
    dailyColumnHelper.accessor(
      (row) => row.cumulative_billable_hours_till_day as unknown,
      {
        id: "cumulative_billable_hours_till_day",
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
      },
    ) as ColumnDef<TrackerRow, unknown>,
    dailyColumnHelper.display({
      id: "qc_score",
      header: () => <div className="text-center">QC Score</div>,
      cell: () => (
        <div className="px-6 py-4 text-center text-gray-400 font-medium italic">
          —
        </div>
      ),
    }),
    dailyColumnHelper.accessor((row) => row.daily_required_hours as unknown, {
      id: "daily_required_hours",
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
  ];
}

export function createMonthlyColumns(
  handleExportMonthDailyExcel: (monthYear: string) => void,
): ColumnDef<MonthlyBillableReportRow, unknown>[] {
  return [
    monthlyColumnHelper.accessor((row) => row.month_year, {
      id: "month_year",
      header: "Month & Year",
      cell: (info) => (
        <div className="px-6 py-4 font-semibold text-gray-900">
          {info.getValue() ?? "-"}
        </div>
      ),
    }) as ColumnDef<MonthlyBillableReportRow, unknown>,
    monthlyColumnHelper.display({
      id: "billable_hours",
      header: () => <div className="text-center">Billable Hours</div>,
      cell: (info) => {
        const row = info.row.original;
        const value =
          row.total_billable_hours || row.total_billable_hours_month;
        return (
          <div className="px-6 py-4 text-center">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-semibold">
              {value != null ? Number(value).toFixed(2) : "-"}
            </Badge>
          </div>
        );
      },
    }),
    monthlyColumnHelper.display({
      id: "monthly_goal",
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
              {goal != null ? Number(goal).toFixed(2) : "-"}
            </Badge>
          </div>
        );
      },
    }),
    monthlyColumnHelper.accessor((row) => row.pending_target as unknown, {
      id: "pending_target",
      header: () => <div className="text-center">Pending Target</div>,
      cell: (info) => {
        const value = info.row.original.pending_target;
        return (
          <div className="px-6 py-4 text-center">
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-semibold">
              {value != null ? Number(value).toFixed(2) : "-"}
            </Badge>
          </div>
        );
      },
    }) as ColumnDef<MonthlyBillableReportRow, unknown>,
    monthlyColumnHelper.accessor((row) => row.avg_qc_score as unknown, {
      id: "avg_qc_score",
      header: () => <div className="text-center">Avg. QC Score</div>,
      cell: (info) => (
        <div className="px-6 py-4 text-center text-gray-400 font-medium italic">
          {info.row.original.avg_qc_score ?? "—"}
        </div>
      ),
    }) as ColumnDef<MonthlyBillableReportRow, unknown>,
    monthlyColumnHelper.display({
      id: "actions",
      header: () => <div className="text-right pr-6">Full Report</div>,
      cell: (info) => (
        <div className="px-6 py-4 text-right pr-6">
          <Button
            variant="outline"
            size="sm"
            className=" border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold gap-2 rounded-lg"
            onClick={() =>
              info.row.original.month_year &&
              handleExportMonthDailyExcel(info.row.original.month_year)
            }
          >
            <Download className="w-4 h-4" />
            Excel
          </Button>
        </div>
      ),
    }),
  ];
}
