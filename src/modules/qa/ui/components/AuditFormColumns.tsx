import { type ColumnDef } from "@tanstack/react-table";
import { Download, Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AuditRecord } from "../../types";

const getQCScoreColorClass = (score: number | string | null | undefined) => {
  if (
    score === null ||
    score === undefined ||
    score === "-" ||
    isNaN(Number(score))
  )
    return "text-slate-700";
  const numScore = Number(score);
  if (numScore >= 95) return "text-green-800 bg-green-100 font-bold";
  if (numScore >= 80) return "text-yellow-700 bg-yellow-100 font-bold";
  return "text-red-700 bg-red-200 font-bold";
};

const formatDateTime = (dateTimeString: string | undefined) => {
  if (!dateTimeString || dateTimeString === "-")
    return { date: "-", time: "-" };
  try {
    const date = new Date(dateTimeString);
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();
    return {
      date: `${day}/${month}/${year}`,
      time: date.toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
  } catch {
    return { date: "-", time: "-" };
  }
};

interface CreateAuditFormColumnsParams {
  onViewErrors: (errorList: any[]) => void;
  onAddScore: (record: AuditRecord) => void;
}

export const createAuditFormColumns = ({
  onViewErrors,
  onAddScore,
}: CreateAuditFormColumnsParams): ColumnDef<AuditRecord, unknown>[] => [
  {
    id: "agentName",
    header: "Agent Name",
    cell: ({ row }) => <p>{row.original.agent_name || "-"}</p>,
  },
  {
    id: "projectName",
    header: "Project Name",
    cell: ({ row }) => <p>{row.original.project_name || "-"}</p>,
  },
  {
    id: "taskName",
    header: "Task Name",
    cell: ({ row }) => <p>{row.original.task_name || "-"}</p>,
  },
  {
    id: "qcFile",
    header: () => <div className="text-center">QC File</div>,
    cell: ({ row }) => (
      <div className="text-center">
        {row.original.file_name && row.original.file_name !== "N/A" ? (
          <a
            href={row.original.file_url || "#"}
            download={row.original.file_name}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800  transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </div>
    ),
  },
  {
    id: "fileRecordCount",
    header: () => <div className="text-center">File Record Count</div>,
    cell: ({ row }) => (
      <p className="text-center font-semibold text-slate-700">
        {row.original.file_record_count || 0}
      </p>
    ),
  },
  {
    id: "qcRecordCount",
    header: () => <div className="text-center">10% QC Record Count</div>,
    cell: ({ row }) => (
      <p className="text-center font-semibold text-blue-600">
        {row.original["10%_data_generated_count"] ||
          row.original.total_qc_performed ||
          0}
      </p>
    ),
  },
  {
    id: "errorScore",
    header: () => <div className="text-center">Error Score</div>,
    cell: ({ row }) => (
      <p className="text-center font-semibold text-red-500">
        {Array.isArray(row.original.error_list)
          ? row.original.error_list.length
          : 0}
      </p>
    ),
  },
  {
    id: "errorList",
    header: () => <div className="text-center">Error List</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-100 border border-slate-200 hover:border-blue-300 rounded-lg text-slate-700 hover:text-blue-700 text-xs font-bold transition-all"
          onClick={() => onViewErrors(row.original.error_list || [])}
        >
          <Eye className="w-3 h-3" />
          View
          {row.original.error_list && row.original.error_list.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px]">
              {row.original.error_list.length}
            </span>
          )}
        </Button>
      </div>
    ),
  },
  {
    id: "status",
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => {
      const status = row.original.status || "Pending";
      const statusClass =
        status === "Approved" || status === "Verified"
          ? "bg-green-100 text-green-800"
          : status === "Rejected"
            ? "bg-red-100 text-red-800"
            : "bg-yellow-100 text-yellow-800";
      return (
        <div className="text-center">
          <Badge className={cn(statusClass)}>{status}</Badge>
        </div>
      );
    },
  },
  {
    id: "qcScore",
    header: () => <div className="text-center">QC Score</div>,
    cell: ({ row }) => {
      const score =
        row.original.qc_score ?? row.original.average_qc_score ?? null;
      return (
        <div className="text-center">
          <Badge className={cn(getQCScoreColorClass(score))}>
            {score != null ? `${Number(score).toFixed(2)}%` : "-"}
          </Badge>
        </div>
      );
    },
  },
  {
    id: "dateTime",
    header: "Date and Time",
    cell: ({ row }) => {
      const { date, time } = formatDateTime(row.original.audit_datetime);
      return (
        <div className="whitespace-nowrap">
          <span className="text-sm font-semibold text-gray-900">{date}</span>
          <br />
          <span className="text-xs text-gray-600">{time}</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => (
      <div className="text-center">
        {!row.original.audit_performed ? (
          <Button
            onClick={() => onAddScore(row.original)}
            className="inline-flex items-center gap-2  bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm shadow-lg hover:shadow-xl transition-all"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            Add Score
          </Button>
        ) : (
          <span className="text-sm text-slate-500 font-medium">
            Score Added
          </span>
        )}
      </div>
    ),
  },
];
