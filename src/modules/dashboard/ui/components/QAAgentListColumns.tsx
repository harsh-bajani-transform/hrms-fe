import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TrackerRow as Tracker } from "@/modules/dashboard/types";

interface CreateQATrackerColumnsParams {
  handleQCForm: (tracker: Tracker) => void;
  dropdownTaskNameMap: { [taskId: string]: string };
}

export const createQATrackerColumns = ({
  handleQCForm,
  dropdownTaskNameMap,
}: CreateQATrackerColumnsParams): ColumnDef<Tracker, unknown>[] => [
  {
    id: "dateTime",
    header: "Date/Time",
    cell: ({ row }) => (
      <div className="text-slate-700 whitespace-nowrap">
        {row.original.date_time
          ? format(new Date(row.original.date_time), "M/d/yyyy h:mma")
          : "-"}
      </div>
    ),
  },
  {
    id: "agentName",
    header: "Agent Name",
    cell: ({ row }) => (
      <div className="text-slate-700 font-bold whitespace-nowrap">
        {row.original.user_name || "-"}
      </div>
    ),
  },
  {
    id: "projectName",
    header: "Project Name",
    cell: ({ row }) => (
      <div className="text-slate-700 whitespace-nowrap">
        {row.original.project_name || "-"}
      </div>
    ),
  },
  {
    id: "taskName",
    header: "Task Name",
    cell: ({ row }) => (
      <div className="text-slate-700 whitespace-nowrap">
        {row.original.task_name ||
          dropdownTaskNameMap[String(row.original.task_id)] ||
          "-"}
      </div>
    ),
  },
  {
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
            className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 rounded-full p-2 shadow-sm cursor-pointer"
            title="Download file"
          >
            <Download className="w-5 h-5" />
          </a>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </div>
    ),
  },
  {
    id: "action",
    header: () => <div className="text-center">Action</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <Button
          onClick={() => handleQCForm(row.original)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 mx-auto focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer border-none"
        >
          <FileText className="w-4 h-4" />
          QC Form
        </Button>
      </div>
    ),
  },
];
