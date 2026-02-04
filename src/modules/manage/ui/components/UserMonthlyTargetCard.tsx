import React, { useState, useMemo } from "react";
import dayjs, { Dayjs } from "dayjs";
import { Download, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DataTable } from "@/components/ui/data-table";
import { createColumns, type Agent } from "./UserMonthlyTargetCardColumns";

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

  const handleRangeChange = (key: string, range: [Dayjs, Dayjs]) => {
    setDateRanges((prev) => ({ ...prev, [key]: range }));
  };

  const handleExportExcel = (monthLabel: string) => {
    toast?.success(`Exporting ${monthLabel} data to Excel...`);
  };

  // Create columns
  const columns = useMemo(() => createColumns(), []);

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
              <DataTable
                columns={columns}
                data={month.agents}
                emptyMessage="No agents available"
                emptyIcon={User}
                showPagination={true}
                pageSize={10}
                className="border-t-0"
                headerClassName="bg-slate-50"
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default UserMonthlyTargetCard;
