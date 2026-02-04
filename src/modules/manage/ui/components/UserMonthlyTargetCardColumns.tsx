import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

export interface Agent {
  id: number;
  userName: string;
  workingDays: number;
  dailyRequiredHours: number;
  monthlyTotalTarget: number;
  monthlyAchievedTarget: number;
}

const columnHelper = createColumnHelper<Agent>();

export function createColumns(): ColumnDef<Agent, unknown>[] {
  return [
    columnHelper.display({
      id: "userName",
      header: () => (
        <div className="px-6 py-4 text-left font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
          User Name
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-6 py-4 text-slate-800 font-semibold whitespace-nowrap">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 border border-slate-200">
              {row.original.userName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            {row.original.userName}
          </div>
        </div>
      ),
    }),
    columnHelper.display({
      id: "workingDays",
      header: () => (
        <div className="px-6 py-4 text-center font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
          Working Days
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-6 py-4 text-center text-slate-700 font-medium">
          {row.original.workingDays}
        </div>
      ),
    }),
    columnHelper.display({
      id: "dailyRequiredHours",
      header: () => (
        <div className="px-6 py-4 text-center font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
          Daily Required
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-6 py-4 text-center text-slate-600">
          {row.original.dailyRequiredHours}h
        </div>
      ),
    }),
    columnHelper.display({
      id: "progress",
      header: () => (
        <div className="px-6 py-4 text-center font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
          Progress / Target
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-6 py-4 text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <span className="text-indigo-600">
                {row.original.monthlyAchievedTarget}
              </span>
              <span className="text-slate-300 font-normal">/</span>
              <span>{row.original.monthlyTotalTarget}</span>
            </div>
            <div className="w-24 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{
                  width: `${Math.min(100, (row.original.monthlyAchievedTarget / row.original.monthlyTotalTarget) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      ),
    }),
  ];
}
