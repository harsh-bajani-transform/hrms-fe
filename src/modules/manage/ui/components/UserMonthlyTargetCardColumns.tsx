import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

export interface Agent {
  id: number;
  userName: string;
  team: string;
  monthlyTarget: number;
  extraAssignHours: number;
  workingDays: number;
  monthlyAchievedTarget: number;
}

const columnHelper = createColumnHelper<Agent>();

export function createColumns(
  onEdit: (agent: Agent) => void,
  onDelete: (agent: Agent) => void,
): ColumnDef<Agent, unknown>[] {
  return [
    columnHelper.display({
      id: "userName",
      header: () => (
        <div className="px-4 py-3 text-left font-bold text-slate-600 uppercase tracking-wider text-[11px]">
          User Name
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
            {row.original.userName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </div>
          <span className="font-bold text-slate-700">{row.original.userName}</span>
        </div>
      ),
    }),
    columnHelper.display({
      id: "team",
      header: () => (
        <div className="px-4 py-3 text-left font-bold text-slate-600 uppercase tracking-wider text-[11px]">
          Team
        </div>
      ),
      cell: ({ row }) => (
        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider border border-slate-200">
          {row.original.team || "N/A"}
        </span>
      ),
    }),
    columnHelper.display({
      id: "monthlyTarget",
      header: () => (
        <div className="px-4 py-3 text-center font-bold text-slate-600 uppercase tracking-wider text-[11px]">
          Monthly Target
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-center font-bold text-slate-800">
          {row.original.monthlyTarget}
        </div>
      ),
    }),
    columnHelper.display({
      id: "extraAssignHours",
      header: () => (
        <div className="px-4 py-3 text-center font-bold text-slate-600 uppercase tracking-wider text-[11px]">
          Extra Assign Hours
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-center font-bold text-indigo-600">
          {row.original.extraAssignHours}
        </div>
      ),
    }),
    columnHelper.display({
      id: "workingDays",
      header: () => (
        <div className="px-4 py-3 text-center font-bold text-slate-600 uppercase tracking-wider text-[11px]">
          Working Days
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-center font-bold text-slate-700">
          {row.original.workingDays}
        </div>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: () => <div className="text-center font-bold text-slate-600 uppercase tracking-wider text-[11px]">Actions</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onEdit(row.original)}
            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
            title="Edit Target"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button
            onClick={() => onDelete(row.original)}
            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
            title="Delete Agent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      ),
    }),
  ];
}
