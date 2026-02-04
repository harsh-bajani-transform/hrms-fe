import { format } from "date-fns";
import { Download, FileText } from "lucide-react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import type { TrackerRow } from "../../../dashboard/types";
import type { QATaskNameMap } from "../../types";

const columnHelper = createColumnHelper<TrackerRow>();

export function createColumns(
  dropdownTaskNameMap: QATaskNameMap,
  agentName: string,
  handleQCForm: (tracker: TrackerRow) => void
): ColumnDef<TrackerRow, unknown>[] {
  return [
    columnHelper.display({
      id: "dateTime",
      header: "Date/Time",
      cell: ({ row }) => (
        <div className="text-slate-700">
          {row.original.date_time
            ? format(new Date(row.original.date_time), "M/d/yyyy h:mma")
            : "-"}
        </div>
      ),
    }),
    columnHelper.display({
      id: "agentName",
      header: "Agent Name",
      cell: ({ row }) => (
        <div className="text-slate-700 font-medium">
          {row.original.user_name || agentName || "-"}
        </div>
      ),
    }),
    columnHelper.display({
      id: "projectName",
      header: "Project Name",
      cell: ({ row }) => (
        <div className="text-slate-700">{row.original.project_name || "-"}</div>
      ),
    }),
    columnHelper.display({
      id: "taskName",
      header: "Task Name",
      cell: ({ row }) => (
        <div className="text-slate-700">
          {row.original.task_name ||
            (row.original.task_id !== undefined
              ? dropdownTaskNameMap[String(row.original.task_id)]
              : undefined) ||
            "-"}
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
    columnHelper.display({
      id: "action",
      header: () => <div className="text-center">Action</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <Button
            onClick={() => handleQCForm(row.original)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            QC Form
          </Button>
        </div>
      ),
    }),
  ];
}
