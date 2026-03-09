import { useAuth } from "../../../../context/AuthContext";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import React, { useState, useMemo } from "react";
import type { Id, TrackerRow } from "../../types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DailyEntryFormModal from "@/components/common/DailyEntryFormModal";

interface UserCardUser {
  user_id?: Id;
  user_name?: string;
  name?: string;
  team_name?: string;
}

export interface UserCardProps {
  user: UserCardUser;
  dailyData: TrackerRow[];
  defaultCollapsed: boolean;
  onExport?: () => void;
  onRefresh?: () => void;
  formatDateTime?: (dt?: string) => string;
}

const defaultFormatDateTime = (dt?: string): string => {
  if (!dt) return "-";
  const dateObj = new Date(dt);
  if (Number.isNaN(dateObj.getTime())) return dt;

  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();

  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
};

const formatDateOnly = (dt?: string): string => {
  if (!dt) return "-";
  const dateObj = new Date(dt);
  if (Number.isNaN(dateObj.getTime())) return dt;

  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();

  return `${day}/${month}/${year}`;
};

export default function UserCard({
  user,
  dailyData,
  formatDateTime,
  onExport,
  onRefresh,
}: UserCardProps) {
  const { user: currentUser } = useAuth();
  const isAgent =
    Number(currentUser?.role_id) === 6 || currentUser?.role_name === "agent";
  const isQA =
    Number(currentUser?.role_id) === 5 ||
    currentUser?.user_role === "QA_AGENT" ||
    currentUser?.role_name === "QA Agent";
  const isAM =
    Number(currentUser?.role_id) === 4 ||
    currentUser?.user_role === "ASSISTANT_MANAGER" ||
    currentUser?.role_name === "Assistant Manager";

  const canSeeActions = isQA || isAM;

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<TrackerRow | null>(null);

  const handleEditClick = (row: TrackerRow) => {
    setSelectedRow(row);
    setIsModalOpen(true);
  };

  const formatFn = formatDateTime ?? defaultFormatDateTime;

  const filteredRows = useMemo(() => {
    return dailyData.filter((row: TrackerRow) => {
      const dt = row.work_date ?? row.date_time ?? row.date;
      if (!dt) return false;

      const date = new Date(dt);
      const startDate = start ? new Date(start) : null;
      const endDate = end ? new Date(end) : null;

      if (startDate && date < startDate) return false;
      if (endDate && date > endDate) return false;
      return true;
    });
  }, [dailyData, start, end]);

  const dailyColumns: ColumnDef<TrackerRow>[] = useMemo(() => {
    const cols: ColumnDef<TrackerRow>[] = [
      {
        header: "Date-Time",
        accessorFn: (row: TrackerRow) =>
          row.work_date
            ? formatDateOnly(row.work_date)
            : formatFn(row.date_time ?? row.date),
        cell: ({ getValue }) => (
          <span className="font-medium font-mono whitespace-nowrap">
            {String(getValue())}
          </span>
        ),
      },
      {
        header: "Assign Hours",
        accessorFn: (row: TrackerRow) => {
          const val = row.tenure_target ?? row.assigned_hours;
          return val != null ? Number(val).toFixed(2) : "-";
        },
        cell: ({ getValue }) => (
          <div className="text-center">{String(getValue())}</div>
        ),
      },
      {
        header: "Worked Hours",
        accessorFn: (row: TrackerRow) => {
          const r = row as Record<string, unknown>;
          return row.cumulative_billable_hours_till_day != null
            ? Number(row.cumulative_billable_hours_till_day).toFixed(2)
            : row.billable_hours != null
              ? Number(row.billable_hours).toFixed(2)
              : typeof r.workedHours === "string" ||
                  typeof r.workedHours === "number"
                ? String(r.workedHours)
                : typeof r.worked_hours === "string" ||
                    typeof r.worked_hours === "number"
                  ? String(r.worked_hours)
                  : "-";
        },
        cell: ({ getValue }) => (
          <div className="text-center font-medium text-gray-900 border-x border-gray-100">
            {String(getValue())}
          </div>
        ),
      },
      {
        header: "QC Score",
        accessorFn: (row: TrackerRow) => {
          const r = row as Record<string, unknown>;
          return row.qc_score != null
            ? Number(row.qc_score)
            : typeof r.qcScore === "number"
              ? r.qcScore
              : null;
        },
        cell: ({ getValue }) => {
          const val = getValue();
          if (val === null || val === undefined) {
            return (
              <div className="text-center text-gray-400 font-medium italic">
                —
              </div>
            );
          }
          const numScore = Number(val);
          let colorClass = "text-slate-700";
          if (numScore >= 98)
            colorClass = "text-green-800 bg-green-100 font-bold";
          else if (numScore >= 95)
            colorClass = "text-yellow-700 bg-yellow-100 font-bold";
          else colorClass = "text-red-700 bg-red-200 font-bold";

          return (
            <div className="text-center">
              <Badge className={`${colorClass} border-transparent`}>
                {numScore.toFixed(2)}%
              </Badge>
            </div>
          );
        },
      },
      {
        header: "Tracker Count",
        accessorFn: (row: TrackerRow) => row.trackers_count_day,
        cell: ({ getValue }) => (
          <div className="text-center font-medium text-gray-900">
            {String(getValue() ?? "—")}
          </div>
        ),
      },
      {
        header: "Daily Required Hours",
        accessorFn: (row: TrackerRow) =>
          row.daily_required_hours != null
            ? Number(row.daily_required_hours).toFixed(2)
            : row.tenure_target != null
              ? Number(row.tenure_target).toFixed(2)
              : "-",
        cell: ({ getValue }) => (
          <div className="text-center">{String(getValue())}</div>
        ),
      },
    ];

    if (canSeeActions) {
      cols.push({
        id: "actions",
        header: "Actions",
        cell: ({ row }: { row: { original: TrackerRow } }) => (
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-blue-50 text-blue-600 rounded"
              onClick={() => handleEditClick(row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        ),
      });
    }

    return cols;
  }, [formatFn, canSeeActions]);

  const handleExportClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onExport) {
      onExport();
    } else {
      handleInternalExport(e);
    }
  };

  const handleInternalExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const exportData = filteredRows.map((row) => {
        const r = row as Record<string, unknown>;

        const workedHours =
          row.billable_hours != null
            ? Number(row.billable_hours).toFixed(2)
            : typeof r.workedHours === "string" ||
                typeof r.workedHours === "number"
              ? String(r.workedHours)
              : typeof r.worked_hours === "string" ||
                  typeof r.worked_hours === "number"
                ? String(r.worked_hours)
                : "-";

        const qcScore =
          row.qc_score != null
            ? Number(row.qc_score).toFixed(2)
            : typeof r.qcScore === "string" || typeof r.qcScore === "number"
              ? String(r.qcScore)
              : "-";

        return {
          "Date-Time": row.work_date
            ? formatDateOnly(row.work_date)
            : formatFn(row.date_time ?? row.date),
          "Assign Hours":
            row.tenure_target != null
              ? Number(row.tenure_target).toFixed(2)
              : "-",
          "Worked Hours":
            row.cumulative_billable_hours_till_day != null
              ? Number(row.cumulative_billable_hours_till_day).toFixed(2)
              : workedHours,
          "QC Score": qcScore !== "-" ? `${qcScore}%` : "-",
          "Tracker Count": row.trackers_count_day ?? "-",
          "Daily Required Hours":
            row.daily_required_hours != null
              ? Number(row.daily_required_hours).toFixed(2)
              : row.tenure_target != null
                ? Number(row.tenure_target).toFixed(2)
                : "-",
        };
      });

      if (exportData.length > 0) {
        const totalWorked = exportData.reduce(
          (sum: number, r: Record<string, string | number>) =>
            sum + (Number.parseFloat(String(r["Worked Hours"])) || 0),
          0,
        );
        const validQC = exportData.filter(
          (r: Record<string, string | number>) =>
            !Number.isNaN(Number.parseFloat(String(r["QC Score"]))),
        );
        const totalQC = validQC.reduce(
          (sum: number, r: Record<string, string | number>) =>
            sum + (Number.parseFloat(String(r["QC Score"])) || 0),
          0,
        );
        const avgQC = validQC.length > 0 ? totalQC / validQC.length : 0;

        const totalRequired = exportData.reduce(
          (sum: number, r: Record<string, string | number>) =>
            sum + (Number.parseFloat(String(r["Daily Required Hours"])) || 0),
          0,
        );
        exportData.push({
          "Date-Time": "Total",
          "Assign Hours": "",
          "Worked Hours": totalWorked.toFixed(2),
          "QC Score": avgQC > 0 ? `${avgQC.toFixed(2)}%` : "-",
          "Tracker Count": filteredRows.reduce(
            (sum, r) => sum + (Number(r.trackers_count_day) || 0),
            0,
          ),
          "Daily Required Hours": totalRequired.toFixed(2),
        });
      }

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet["!cols"] = [
        { wch: 24 },
        { wch: 16 },
        { wch: 16 },
        { wch: 12 },
        { wch: 20 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        user.user_name || "User",
      );

      const filename = `Daily_Report_${user.user_name || "User"}_${start || "all"}_${end || "all"}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success("Daily report exported!");
    } catch {
      toast.error("Failed to export daily report");
    }
  };

  if (isAgent) {
    return (
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <DataTable
          columns={dailyColumns}
          data={filteredRows}
          showPagination={true}
          pageSize={10}
          containerClassName="border-0"
        />
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full mb-6">
      <AccordionItem
        value="item-1"
        className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-900">
              {user.user_name}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <Input
                type="date"
                className="w-36  text-xs"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-gray-400">to</span>
              <Input
                type="date"
                className="w-36  text-xs"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setStart("");
                  setEnd("");
                }}
              >
                Clear
              </Button>
            </div>

            <Button
              className="bg-green-600 hover:bg-green-700  px-4 text-white font-semibold shadow-sm"
              onClick={handleExportClick}
            >
              Export
            </Button>

            <AccordionTrigger className="hover:no-underline hover:bg-gray-100/50 rounded-lg p-2 transition-all [&[data-state=open]>svg]:rotate-180" />
          </div>
        </div>

        <AccordionContent className="p-0">
          <DataTable
            columns={dailyColumns}
            data={filteredRows}
            showPagination={true}
            pageSize={10}
            containerClassName="border-0"
          />
        </AccordionContent>
      </AccordionItem>

      <DailyEntryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={() => {
          setIsModalOpen(false);
          if (onRefresh) onRefresh();
        }}
        isEditMode={true}
        user={
          {
            user_id: user.user_id ?? undefined,
            user_name: user.user_name || (user as Record<string, unknown>).name || "",
            team_name: user.team_name || "",
          } as { user_id?: Id; user_name: string; team_name: string }
        }
        userId={(user.user_id as Id) ?? null}
        initialData={
          selectedRow
            ? {
                assignHours: (selectedRow.tenure_target ??
                  selectedRow.assigned_hours ??
                  "") as string | number,
                qcScore: (selectedRow.qc_score ?? "") as string | number,
              }
            : null
        }
        date={
          (selectedRow?.work_date ||
            selectedRow?.date_time ||
            (selectedRow as Record<string, unknown>)?.date ||
            null) as string | null
        }
      />
    </Accordion>
  );
}
