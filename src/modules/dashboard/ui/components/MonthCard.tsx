import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import type { MonthlyBillableReportRow } from "../../services/billableReportService";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

interface MonthObj {
  label: string;
  year: string;
}

interface TeamOption {
  label: string;
  value: string;
}

export interface MonthCardProps {
  month: MonthObj;
  users: MonthlyBillableReportRow[];
  onExport?: (user: MonthlyBillableReportRow) => void;
  onExportMonth?: (month: MonthObj, users: MonthlyBillableReportRow[]) => void;
  teamOptions?: TeamOption[];
}

export default function MonthCard({
  month,
  users,
  onExport,
  onExportMonth,
  teamOptions = [],
}: MonthCardProps) {
  const [teamFilter, setTeamFilter] = useState<string>("");

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (!teamFilter || teamFilter === "_all") return true;
      return u.team_name === teamFilter;
    });
  }, [users, teamFilter]);

  const monthlyColumns: ColumnDef<MonthlyBillableReportRow>[] = useMemo(
    () => [
      {
        header: "User Name / Team",
        accessorFn: (row) => row.user_name,
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-gray-900">
              {row.original.user_name}
            </div>
            <div className="text-xs text-gray-500 font-normal">
              {row.original.team_name || "No Team"}
            </div>
          </div>
        ),
      },
      {
        header: "Billable Hour Delivered",
        accessorFn: (row) =>
          row.total_billable_hours
            ? Number(row.total_billable_hours).toFixed(2)
            : "-",
        cell: ({ getValue }) => (
          <div className="text-center font-medium font-mono">
            {getValue<string>()}
          </div>
        ),
      },
      {
        header: "Monthly Goal",
        accessorFn: (row) => row.monthly_target ?? "-",
        cell: ({ getValue }) => (
          <div className="text-center font-mono">{getValue<string>()}</div>
        ),
      },
      {
        header: "Pending Target",
        accessorFn: (row) =>
          row.pending_target ? Number(row.pending_target).toFixed(2) : "-",
        cell: ({ getValue }) => (
          <div className="text-center text-red-600 font-medium font-mono">
            {getValue<string>()}
          </div>
        ),
      },
      {
        header: "Avg. QC Score",
        accessorFn: (row) =>
          row.avg_qc_score ? Number(row.avg_qc_score).toFixed(2) : "-",
        cell: ({ getValue }) => (
          <div className="text-center font-mono">{getValue<string>()}</div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs h-8 font-semibold"
              onClick={() => onExport?.(row.original)}
            >
              Export Daily
            </Button>
          </div>
        ),
      },
    ],
    [onExport],
  );

  return (
    <Accordion type="single" collapsible className="w-full mb-6">
      <AccordionItem
        value="item-1"
        className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h4 className="text-xl font-bold text-gray-900">
              {month.label} {month.year}
            </h4>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
              Monthly Summary
            </span>
          </div>

          <div className="flex items-center gap-4">
            {teamOptions.length > 0 && (
              <div className="hidden md:block w-48">
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger className="h-9 w-full bg-white border-gray-200 text-xs shadow-sm">
                    <SelectValue placeholder="Filter by Team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">All Teams</SelectItem>
                    {teamOptions.map((t) => (
                      <SelectItem key={t.label} value={t.label}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700 h-9 px-4 text-white font-semibold shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                onExportMonth?.(month, filteredUsers);
              }}
            >
              Export Month
            </Button>

            <AccordionTrigger className="hover:no-underline hover:bg-gray-100/50 rounded-lg p-2 transition-all [&[data-state=open]>svg]:rotate-180" />
          </div>
        </div>

        <AccordionContent className="p-0">
          <DataTable
            columns={monthlyColumns}
            data={filteredUsers}
            showPagination={true}
            pageSize={10}
            containerClassName="border-0"
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
