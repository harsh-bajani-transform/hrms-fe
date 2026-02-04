import { format } from "date-fns";
import { Download } from "lucide-react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { TrackerRow } from "../../../dashboard/types";

const columnHelper = createColumnHelper<TrackerRow>();

interface DropdownTaskMap {
  [taskId: string]: number | string | undefined;
}

export function createColumns(
  dropdownTaskMap: DropdownTaskMap
): ColumnDef<TrackerRow, unknown>[] {
  return [
    columnHelper.display({
      id: "dateTime",
      header: "Date/Time",
      cell: ({ row }) => (
        <div className="font-medium text-gray-700">
          {row.original.date_time
            ? format(new Date(row.original.date_time), "M/d/yyyy h:mma")
            : "-"}
        </div>
      ),
    }),
    columnHelper.display({
      id: "agent",
      header: "Agent",
      cell: ({ row }) => (
        <div className="font-medium text-blue-700">
          {row.original.user_name || "-"}
        </div>
      ),
    }),
    columnHelper.display({
      id: "project",
      header: "Project",
      cell: ({ row }) => (
        <div className="text-gray-700">{row.original.project_name || "-"}</div>
      ),
    }),
    columnHelper.display({
      id: "task",
      header: "Task",
      cell: ({ row }) => (
        <div className="text-gray-700">{row.original.task_name || "-"}</div>
      ),
    }),
    columnHelper.display({
      id: "tenureTarget",
      header: "Per Hour Target",
      cell: ({ row }) => (
        <div>
          <Badge
            variant="outline"
            className="font-medium border-gray-300 bg-gray-50 text-gray-700"
          >
            {row.original.tenure_target ||
              dropdownTaskMap[String(row.original.task_id)] ||
              "0"}
          </Badge>
        </div>
      ),
    }),
    columnHelper.display({
      id: "production",
      header: "Production",
      cell: ({ row }) => (
        <div>
          <Badge className="bg-green-100 text-green-700 border-green-200 font-semibold">
            {row.original.production || "0"}
          </Badge>
        </div>
      ),
    }),
    columnHelper.display({
      id: "billableHours",
      header: "Billable Hours",
      cell: ({ row }) => (
        <div>
          <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-semibold">
            {row.original.billable_hours !== null &&
            row.original.billable_hours !== undefined
              ? Number(row.original.billable_hours).toFixed(2)
              : "0.00"}
          </Badge>
        </div>
      ),
    }),
    columnHelper.display({
      id: "file",
      header: () => <div className="text-center">File</div>,
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.tracker_file ? (
            <a
              href={row.original.tracker_file}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 transition-colors"
              title="Download file"
            >
              <Download className="w-5 h-5" />
            </a>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </div>
      ),
    }),
  ];
}
