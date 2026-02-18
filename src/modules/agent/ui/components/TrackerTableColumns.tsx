import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AgentTrackerRow, CreateTrackerColumnsParams } from "../../types";
import type { Id } from "../../../dashboard/types";

export const createTrackerColumns = ({
  handleDelete,
  getProjectName,
  getTaskName,
  isToday,
}: CreateTrackerColumnsParams): ColumnDef<AgentTrackerRow, unknown>[] => [
  {
    id: "date",
    header: "Date",
    cell: ({ row }) => (
      <div className="font-medium text-gray-700">
        {row.original.date_time
          ? format(new Date(row.original.date_time), "dd/MM/yyyy")
          : "-"}
      </div>
    ),
  },
  {
    id: "project",
    header: "Project",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500" />
        <span className="font-medium text-gray-900">
          {row.original.project_name ||
            getProjectName(row.original.project_id || "")}
        </span>
      </div>
    ),
  },
  {
    id: "task",
    header: "Task",
    cell: ({ row }) => (
      <div className="text-gray-700">
        {row.original.task_name ||
          getTaskName(
            row.original.task_id || "",
            row.original.project_id || "",
          )}
      </div>
    ),
  },
  {
    id: "tenureTarget",
    header: () => <div className="text-center">Per Hour Target</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <Badge
          variant="outline"
          className="font-medium border-gray-300 bg-gray-50 text-gray-700"
        >
          {row.original.tenure_target ?? "-"}
        </Badge>
      </div>
    ),
  },
  {
    id: "production",
    header: () => <div className="text-center">Production</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-medium">
          {row.original.production}
        </Badge>
      </div>
    ),
  },
  {
    id: "billableHours",
    header: () => <div className="text-center">Billable Hours</div>,
    cell: ({ row }) => (
      <div className="text-center font-medium text-gray-700">
        {row.original.billable_hours != null
          ? Number(row.original.billable_hours).toFixed(2)
          : "0.00"}
      </div>
    ),
  },
  {
    id: "file",
    header: () => <div className="text-center">File</div>,
    cell: ({ row }) => (
      <div className="text-center">
        {row.original.tracker_file ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-lg hover:bg-blue-100 text-blue-600"
            asChild
          >
            <a
              href={row.original.tracker_file}
              download
              target="_blank"
              rel="noreferrer"
            >
              <Download className="w-4 h-4" />
            </a>
          </Button>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </div>
    ),
  },
  {
    id: "action",
    header: () => <div className="text-right pr-6">Action</div>,
    cell: ({ row }) => (
      <div className="text-right pr-6">
        {isToday(row.original.date_time) ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full hover:bg-red-50 text-red-500"
            onClick={() => handleDelete(row.original.tracker_id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        )}
      </div>
    ),
  },
];
