import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Task } from "../../types";

export const createTaskColumns = (): ColumnDef<Task, unknown>[] => [
  {
    accessorKey: "name",
    header: "Task Name",
    cell: ({ getValue }) => (
      <div className="py-4 font-semibold text-slate-900">
        {getValue() as string}
      </div>
    ),
  },
  {
    accessorKey: "target",
    header: () => <div className="text-center">Target/Hr</div>,
    cell: ({ getValue }) => (
      <div className="py-4 text-center">
        <Badge
          variant="outline"
          className="font-bold text-slate-600 border-slate-200"
        >
          {getValue() as number}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue() as string;
      return (
        <div className="py-4">
          <Badge
            variant={
              status === "Completed"
                ? "success"
                : status === "In Progress"
                  ? "warning"
                  : "secondary"
            }
            className="font-bold text-[10px] py-0.5"
          >
            {status}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ getValue }) => {
      const priority = getValue() as string;
      return (
        <div className="py-4">
          <Badge
            variant={
              priority === "High"
                ? "destructive"
                : priority === "Medium"
                  ? "warning"
                  : "secondary"
            }
            className="font-bold text-[10px] py-0.5"
          >
            {priority}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "due",
    header: () => <div className="text-right pr-6">Due Date</div>,
    cell: ({ getValue }) => (
      <div className="py-4 text-right pr-6 text-slate-500 font-medium text-xs">
        {getValue() as string}
      </div>
    ),
  },
];
