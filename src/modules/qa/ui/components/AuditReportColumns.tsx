import { type ColumnDef } from "@tanstack/react-table";
import { Download } from "lucide-react";
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

export const createAuditReportColumns = (): ColumnDef<
  AuditRecord,
  unknown
>[] => [
  {
    id: "auditDateTime",
    header: "Audit Date & Time",
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
    id: "agentName",
    header: "Agent Name",
    cell: ({ row }) => <p>{row.original.agent_name || "-"}</p>,
  },
  {
    id: "project",
    header: "Project",
    cell: ({ row }) => <p>{row.original.project_name || "-"}</p>,
  },
  {
    id: "task",
    header: "Task",
    cell: ({ row }) => <p>{row.original.task_name || "-"}</p>,
  },
  {
    id: "totalQCs",
    header: () => <div className="text-center">Total QCs</div>,
    cell: ({ row }) => (
      <p className="text-center font-semibold text-blue-600">
        {row.original.total_qc_performed || 0}
      </p>
    ),
  },
  {
    id: "qcScore",
    header: () => <div className="text-center">QC Score</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <Badge
          className={cn(
            "px-3 py-1 rounded-lg inline-block",
            getQCScoreColorClass(row.original.average_qc_score),
          )}
        >
          {row.original.average_qc_score != null
            ? `${Number(row.original.average_qc_score).toFixed(2)}%`
            : "-"}
        </Badge>
      </div>
    ),
  },
  {
    id: "qcCheckedFile",
    header: () => <div className="text-center">QC Checked File</div>,
    cell: ({ row }) => (
      <div className="text-center">
        {row.original.qc_checked_file &&
        row.original.qc_checked_file !== "-" ? (
          <a
            href={row.original.qc_checked_file}
            download={row.original.qc_checked_file.split("/").pop()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )}
      </div>
    ),
  },
  {
    id: "status",
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => {
      const status = row.original.status || "-";
      const statusClass =
        status === "Approved" || status === "Verified"
          ? "bg-green-100 text-green-800"
          : status === "Rejected"
            ? "bg-red-100 text-red-800"
            : status === "Pending"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-slate-100 text-slate-700";
      return (
        <div className="text-center">
          <Badge
            className={cn(
              "font-semibold text-sm border-none px-3 py-1",
              statusClass,
            )}
          >
            {status}
          </Badge>
        </div>
      );
    },
  },
  {
    id: "errorNotes",
    header: "Error Notes",
    cell: ({ row }) => (
      <div className="text-gray-600 text-sm max-w-[200px] truncate">
        {row.original.error_notes || row.original.notes || "-"}
      </div>
    ),
  },
];
