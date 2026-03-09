import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Download } from "lucide-react";

export interface Tracker {
  tracker_id: number | string;
  user_id: number | string;
  date_time?: string;
  user_name?: string;
  project_name?: string;
  task_name?: string;
  tracker_file?: string;
  task_id?: number | string;
  tenure_target?: number | string;
  production?: number | string;
  billable_hours?: number | string | null;
  shift_type?: string;
}

export const createColumns = (
  dropdownTaskMap: Record<string, number | string>
): ColumnDef<Tracker>[] => [
  {
    accessorKey: "date_time",
    header: "Date/Time",
    cell: ({ row }) => {
      const dateTime = row.original.date_time;
      if (!dateTime) return "-";
      const d = new Date(dateTime);
      return isNaN(d.getTime()) ? dateTime : format(d, "M/d/yyyy h:mma");
    },
  },
  {
    accessorKey: "user_name",
    header: "Agent",
    cell: ({ row }) => (
      <span className="font-semibold text-blue-700">
        {row.original.user_name || "-"}
      </span>
    ),
  },
  {
    accessorKey: "project_name",
    header: "Project",
    cell: ({ row }) => row.original.project_name || "-",
  },
  {
    accessorKey: "task_name",
    header: "Task",
    cell: ({ row }) => row.original.task_name || "-",
  },
  {
    accessorKey: "tenure_target",
    header: "Per Hour Target",
    cell: ({ row }) =>
      row.original.tenure_target ||
      dropdownTaskMap[String(row.original.task_id)] ||
      "0",
  },
  {
    accessorKey: "production",
    header: "Production",
    cell: ({ row }) => (
      <span className="font-bold text-green-700">
        {row.original.production || "0"}
      </span>
    ),
  },
  {
    accessorKey: "billable_hours",
    header: "Billable Hours",
    cell: ({ row }) => {
      const billable = row.original.billable_hours;
      return (
        <span className="font-bold text-purple-700">
          {billable !== null && billable !== undefined
            ? Number(billable).toFixed(2)
            : "0.00"}
        </span>
      );
    },
  },
  {
    accessorKey: "tracker_file",
    header: "File",
    cell: ({ row }) => {
      const file = row.original.tracker_file;
      return (
        <div className="text-center">
          {file ? (
            <a
              href={file}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 rounded-full p-2 shadow-sm cursor-pointer"
              title="Download file"
            >
              <Download className="w-5 h-5" />
            </a>
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </div>
      );
    },
  },
];
