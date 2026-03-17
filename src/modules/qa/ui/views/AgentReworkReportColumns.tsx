import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ReworkTracker {
  id: number;
  agent_name: string;
  worked_datetime: string;
  evaluation_datetime: string;
  project_name: string;
  task_name: string;
  status: string | number;
  qc_score: number | string;
  rework_file_path: string;
  // UI compatibility fields
  date_time?: string;
  qc_datetime?: string;
  qc_status?: string | number;
}

export const reworkReportColumns: ColumnDef<ReworkTracker>[] = [
  {
    accessorKey: "worked_datetime",
    header: "Worked Date/Time",
    cell: ({ row }) => {
      const date = row.original.worked_datetime;
      return (
        <div className="text-slate-700 whitespace-nowrap">
          {date ? format(new Date(date), "M/d/yyyy h:mma") : "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "project_name",
    header: "Project Name",
    cell: ({ row }) => (
      <div className="text-slate-700 font-medium">
        {row.original.project_name || "-"}
      </div>
    ),
  },
  {
    accessorKey: "task_name",
    header: "Task Name",
    cell: ({ row }) => (
      <div className="text-slate-700 text-xs shadow-sm bg-slate-50 px-2 py-1 rounded inline-block">
        {row.original.task_name || "-"}
      </div>
    ),
  },
  {
    accessorKey: "qc_score",
    header: "QC Score",
    cell: ({ row }) => {
      const score = Number(row.original.qc_score);
      let colorClass = "bg-slate-100 text-slate-700";
      if (!isNaN(score)) {
        if (score >= 95) colorClass = "bg-green-100 text-green-700";
        else if (score >= 80) colorClass = "bg-yellow-100 text-yellow-700";
        else colorClass = "bg-red-100 text-red-700";
      }
      return (
        <Badge className={`${colorClass} border-none font-bold px-3`}>
          {row.original.qc_score}%
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge className="bg-blue-50 text-blue-700 border-none font-bold px-3">
          {status || "Pending"}
        </Badge>
      );
    },
  },
  {
    id: "file",
    header: () => <div className="text-center">Rework File</div>,
    cell: ({ row }) => (
      <div className="text-center">
        {row.original.rework_file_path ? (
          <a
            href={row.original.rework_file_path}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 rounded-full p-2 shadow-sm cursor-pointer"
            title="Download rework file"
          >
            <Download className="w-5 h-5" />
          </a>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </div>
    ),
  },
];
