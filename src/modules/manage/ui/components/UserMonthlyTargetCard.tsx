import React, { useState, useMemo } from "react";
import dayjs, { Dayjs } from "dayjs";
import { Download, ChevronDown, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/ui/pagination";

interface Agent {
  id: number;
  userName: string;
  workingDays: number;
  dailyRequiredHours: number;
  monthlyTotalTarget: number;
  monthlyAchievedTarget: number;
}

interface MonthData {
  key: string;
  label: string;
  range: [Dayjs, Dayjs];
  agents: Agent[];
}

const monthsData: MonthData[] = [
  {
    key: "2025-12",
    label: "DEC 2025",
    range: [dayjs("2025-12-01"), dayjs("2025-12-31")],
    agents: [
      {
        id: 1,
        userName: "John Doe",
        workingDays: 22,
        dailyRequiredHours: 8,
        monthlyTotalTarget: 176,
        monthlyAchievedTarget: 150,
      },
      {
        id: 2,
        userName: "Jane Smith",
        workingDays: 20,
        dailyRequiredHours: 7,
        monthlyTotalTarget: 140,
        monthlyAchievedTarget: 120,
      },
      {
        id: 3,
        userName: "Alex Johnson",
        workingDays: 21,
        dailyRequiredHours: 8,
        monthlyTotalTarget: 168,
        monthlyAchievedTarget: 160,
      },
    ],
  },
  {
    key: "2026-01",
    label: "JAN 2026",
    range: [dayjs("2026-01-01"), dayjs("2026-01-31")],
    agents: [
      {
        id: 4,
        userName: "Emily Clark",
        workingDays: 21,
        dailyRequiredHours: 8,
        monthlyTotalTarget: 168,
        monthlyAchievedTarget: 140,
      },
      {
        id: 5,
        userName: "Michael Brown",
        workingDays: 22,
        dailyRequiredHours: 7,
        monthlyTotalTarget: 154,
        monthlyAchievedTarget: 130,
      },
    ],
  },
  {
    key: "2026-02",
    label: "FEB 2026",
    range: [dayjs("2026-02-01"), dayjs("2026-02-28")],
    agents: [
      {
        id: 6,
        userName: "Sophia Lee",
        workingDays: 20,
        dailyRequiredHours: 8,
        monthlyTotalTarget: 160,
        monthlyAchievedTarget: 120,
      },
      {
        id: 7,
        userName: "David Kim",
        workingDays: 19,
        dailyRequiredHours: 7,
        monthlyTotalTarget: 133,
        monthlyAchievedTarget: 110,
      },
    ],
  },
];

type EditState = {
  [monthKey: string]: {
    [agentId: number]: {
      [field: string]: number;
    };
  };
};

type EditingCell = {
  monthKey: string | null;
  agentId: number | null;
  field: string | null;
};

const UserMonthlyTargetCard: React.FC = () => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {};
    monthsData.forEach((m) => {
      state[m.key] = true;
    });
    return state;
  });

  const [dateRanges, setDateRanges] = useState<Record<string, [Dayjs, Dayjs]>>(
    () => {
      const obj: Record<string, [Dayjs, Dayjs]> = {};
      monthsData.forEach((m) => {
        obj[m.key] = m.range;
      });
      return obj;
    },
  );

  const [editState, setEditState] = useState<EditState>({});
  const [editingCell, setEditingCell] = useState<EditingCell>({
    monthKey: null,
    agentId: null,
    field: null,
  });

  const handleCellDoubleClick = (
    monthKey: string,
    agentId: number,
    field: string,
    value: number,
  ) => {
    setEditingCell({ monthKey, agentId, field });
    setEditState((prev) => ({
      ...prev,
      [monthKey]: {
        ...(prev[monthKey] || {}),
        [agentId]: {
          ...(prev[monthKey]?.[agentId] || {}),
          [field]: value,
        },
      },
    }));
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    monthKey: string,
    agentId: number,
    field: string,
  ) => {
    const value = Number(e.target.value);
    setEditState((prev) => ({
      ...prev,
      [monthKey]: {
        ...(prev[monthKey] || {}),
        [agentId]: {
          ...(prev[monthKey]?.[agentId] || {}),
          [field]: value,
        },
      },
    }));
  };

  const handleEditSave = () => {
    setEditingCell({ monthKey: null, agentId: null, field: null });
  };

  const handleRangeChange = (key: string, range: [Dayjs, Dayjs]) => {
    setDateRanges((prev) => ({ ...prev, [key]: range }));
  };

  const handleExportExcel = (monthLabel: string) => {
    toast?.success(`Exporting ${monthLabel} data to Excel...`);
  };

  // Define columns for the table
  const columns = useMemo<ColumnDef<Agent, unknown>[]>(
    () => [
      {
        id: "userName",
        accessorKey: "userName",
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
      },
      {
        id: "workingDays",
        accessorKey: "workingDays",
        header: () => (
          <div className="px-6 py-4 text-center font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
            Working Days
          </div>
        ),
        cell: ({ row }) => {
          const monthKey = row.original.id.toString(); // Using agent id as key
          return (
            <div className="px-6 py-4 text-center text-slate-700 font-medium">
              {row.original.workingDays}
            </div>
          );
        },
      },
      {
        id: "dailyRequiredHours",
        accessorKey: "dailyRequiredHours",
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
      },
      {
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
      },
    ],
    [],
  );

  return (
    <div className="w-full space-y-6">
      <div className="mb-2 ">
        <h2 className="text-2xl flex items-center gap-2 font-bold text-blue-600 tracking-tight">
          <User /> User Monthly Targets
        </h2>
        <p className="text-slate-500 text-sm">
          Review and manage monthly production goals for agents.
        </p>
      </div>
      <Accordion
        type="multiple"
        value={Object.entries(expanded)
          .filter(([_, v]) => v)
          .map(([k]) => k)}
        onValueChange={(val) => {
          const newState: Record<string, boolean> = {};
          monthsData.forEach((m) => {
            newState[m.key] = val.includes(m.key);
          });
          setExpanded(newState);
        }}
        className="space-y-6"
      >
        {monthsData.map((month) => (
          <AccordionItem
            key={month.key}
            value={month.key}
            className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 border-none"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg text-slate-800 tracking-tight">
                  {month.label}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-slate-500 uppercase">
                    <span>From</span>
                    <Input
                      className=" w-28 bg-transparent border-none p-0 text-slate-700 font-semibold cursor-pointer shadow-none"
                      type="date"
                      value={(
                        dateRanges[month.key]?.[0] ?? month.range[0]
                      ).format("YYYY-MM-DD")}
                      min={month.range[0].format("YYYY-MM-DD")}
                      max={month.range[1].format("YYYY-MM-DD")}
                      onChange={(e) =>
                        handleRangeChange(month.key, [
                          dayjs(e.target.value),
                          dateRanges[month.key]?.[1] ?? month.range[1],
                        ])
                      }
                    />
                  </div>
                  <div className="w-px h-4 bg-slate-200" />
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-slate-500 uppercase">
                    <span>To</span>
                    <Input
                      className="w-28 bg-transparent border-none p-0 text-slate-700 font-semibold cursor-pointer shadow-none"
                      type="date"
                      value={(
                        dateRanges[month.key]?.[1] ?? month.range[1]
                      ).format("YYYY-MM-DD")}
                      min={month.range[0].format("YYYY-MM-DD")}
                      max={month.range[1].format("YYYY-MM-DD")}
                      onChange={(e) =>
                        handleRangeChange(month.key, [
                          dateRanges[month.key]?.[0] ?? month.range[0],
                          dayjs(e.target.value),
                        ])
                      }
                    />
                  </div>
                </div>
                <Button
                  variant="default"
                  onClick={() => handleExportExcel(month.label)}
                  className="bg-emerald-600 hover:bg-emerald-700 px-4"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </Button>
                <AccordionTrigger className="p-2 rounded-full hover:bg-slate-200 transition-all text-slate-500 hover:no-underline" />
              </div>
            </div>
            <AccordionContent className="p-0 pt-0">
              {(() => {
                const table = useReactTable({
                  data: month.agents,
                  columns,
                  getCoreRowModel: getCoreRowModel(),
                  getPaginationRowModel: getPaginationRowModel(),
                  initialState: {
                    pagination: { pageSize: 10 },
                  },
                });

                return (
                  <>
                    <Table>
                      <TableHeader className="bg-slate-50">
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow
                            key={headerGroup.id}
                            className="border-b border-slate-100"
                          >
                            {headerGroup.headers.map((header) => (
                              <TableHead key={header.id} className="p-0">
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-100">
                        {table.getRowModel().rows.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={columns.length}
                              className="h-24 text-center text-slate-500"
                            >
                              No agents available
                            </TableCell>
                          </TableRow>
                        ) : (
                          table.getRowModel().rows.map((row) => (
                            <TableRow
                              key={row.id}
                              className="hover:bg-slate-50 transition-colors group"
                            >
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} className="p-0">
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext(),
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                    <div className="border-t border-slate-100 bg-white">
                      <DataTablePagination table={table} />
                    </div>
                  </>
                );
              })()}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default UserMonthlyTargetCard;
