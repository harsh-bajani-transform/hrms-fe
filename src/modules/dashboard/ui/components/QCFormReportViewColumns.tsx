import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  AlertCircle,
  CheckCircle2,
  Award,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface QCReport {
  id: string | number;
  timestamp: string;
  date_of_file_submission: string;
  am_name?: string;
  qa_name?: string;
  agent_name?: string;
  project_name?: string;
  task_name?: string;
  file_record_count?: number;
  "10%_qc_file_records"?: number;
  "10%_data_generated_count"?: number;
  qc_score: string | number;
  status: string;
  error_list?: string | unknown[];
  file_path?: string;
}

interface ColumnProps {
  onViewErrors: (report: QCReport) => void;
}

export const createQCReportColumns = ({
  onViewErrors,
}: ColumnProps): ColumnDef<QCReport>[] => [
  {
    accessorKey: "timestamp",
    header: "Evaluation Date & Time",
    cell: ({ row }) => {
      const timestamp = row.getValue("timestamp") as string;
      if (!timestamp) return <span className="text-slate-400">—</span>;
      const date = new Date(timestamp);
      return (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 text-sm">
              {format(date, "dd MMM yyyy")}
            </span>
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded w-fit mt-1">
              {format(date, "hh:mm a")}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "date_of_file_submission",
    header: "Work Date",
    cell: ({ row }) => {
      const dateStr = row.getValue("date_of_file_submission") as string;
      if (!dateStr) return <span className="text-slate-400">—</span>;
      return (
        <span className="font-medium text-slate-700">
          {format(new Date(dateStr), "dd MMM yyyy")}
        </span>
      );
    },
  },
  {
    accessorKey: "am_name",
    header: "Assistant Manager",
    cell: ({ row }) => (
      <span className="font-medium text-slate-700">
        {row.getValue("am_name") || "N/A"}
      </span>
    ),
  },
  {
    accessorKey: "qa_name",
    header: "QA Agent",
    cell: ({ row }) => (
      <span className="font-medium text-slate-700">
        {row.getValue("qa_name") || "N/A"}
      </span>
    ),
  },
  {
    accessorKey: "agent_name",
    header: "Agent",
    cell: ({ row }) => (
      <span className="font-semibold text-slate-900">
        {row.getValue("agent_name") || "N/A"}
      </span>
    ),
  },
  {
    accessorKey: "project_name",
    header: "Project / Task",
    cell: ({ row }) => {
      const project = row.getValue("project_name") as string;
      const task = row.original.task_name;
      return (
        <div className="max-w-[180px]">
          <div
            className="font-bold text-slate-900 mb-1 truncate"
            title={project}
          >
            {project || "N/A"}
          </div>
          <div className="text-[9px] text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded inline-block uppercase tracking-wider truncate max-w-full">
            {task || "N/A"}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "file_record_count",
    header: "Total Record",
    cell: ({ row }) => (
      <span className="font-medium text-slate-700">
        {row.original.file_record_count ?? "0"}
      </span>
    ),
  },
  {
    accessorKey: "10%_qc_file_records",
    header: "QC Record",
    cell: ({ row }) => (
      <span className="font-medium text-slate-700">
        {row.original["10%_qc_file_records"] ?? "0"}
      </span>
    ),
  },
  {
    id: "errorsCount",
    header: "Errors",
    cell: ({ row }) => {
      let eList = [];
      try {
        const raw = row.original.error_list;
        eList = typeof raw === "string" ? JSON.parse(raw) : raw || [];
      } catch {
        eList = [];
      }
      return <span className="font-bold text-red-600">{eList.length}</span>;
    },
  },
  {
    id: "errorList",
    header: "Error List",
    cell: ({ row }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold text-xs"
          onClick={() => onViewErrors(row.original)}
        >
          <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
          View Details
        </Button>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = ((row.getValue("status") as string) || "")
        .toLowerCase()
        .trim();
      if (status === "regular") {
        return (
          <Badge
            className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
            variant="outline"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            Regular
          </Badge>
        );
      } else if (status === "rework") {
        return (
          <Badge
            className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100"
            variant="outline"
          >
            <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
            Rework
          </Badge>
        );
      } else {
        return (
          <Badge
            className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100"
            variant="outline"
          >
            <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
            {status || "Correction"}
          </Badge>
        );
      }
    },
  },
  {
    accessorKey: "qc_score",
    header: "QC Score",
    cell: ({ row }) => {
      const score = parseFloat((row.getValue("qc_score") as string) || "0");
      let className = "";

      if (score > 98) {
        className = "bg-green-100 text-green-700 border-green-200";
      } else if (score >= 95) {
        className = "bg-yellow-100 text-yellow-700 border-yellow-200";
      } else {
        className = "bg-red-100 text-red-700 border-red-200";
      }

      return (
        <Badge
          className={`font-bold py-1 px-3 border-2 ${className}`}
          variant="outline"
        >
          <Award className="w-3.5 h-3.5 mr-1.5" />
          {score.toFixed(2)}%
        </Badge>
      );
    },
  },
];
