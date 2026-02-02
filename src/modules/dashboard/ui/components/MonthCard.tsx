import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from "../../../../context/AuthContext";
import type { MonthlyBillableReportRow } from "../../services/billableReportService";

type Month = { label: string; year: string };

type TeamOption = { label: string; value?: string };

export interface MonthCardProps {
  month: Month;
  users: MonthlyBillableReportRow[];
  onExport: (user: MonthlyBillableReportRow) => void;
  onExportMonth?: (month: Month, users: MonthlyBillableReportRow[]) => void;
  teamOptions?: TeamOption[];
}

export default function MonthCard({
  month,
  users,
  onExport,
  onExportMonth,
  teamOptions = [],
}: MonthCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState("");
  const { user } = useAuth();

  const isAgent = Number(user?.role_id) === 6 || user?.role_name === "agent";

  const teams = useMemo((): Array<{ label: string; value: string }> => {
    if (teamOptions.length > 0) {
      return [
        { label: "All Teams", value: "" },
        ...teamOptions.map((t) => ({ label: t.label, value: t.label })),
      ];
    }

    const unique = Array.from(
      new Set(users.map((u) => u.team_name).filter(Boolean)),
    ) as string[];

    return [
      { label: "All Teams", value: "" },
      ...unique.map((team) => ({ label: team, value: team })),
    ];
  }, [users, teamOptions]);

  const filteredUsers =
    !isAgent && selectedTeam
      ? users.filter((u) => u.team_name === selectedTeam)
      : users;

  return (
    <div className="relative bg-linear-to-br from-blue-50 via-white to-slate-100 border-l-8 border-blue-500 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 mb-6">
      <div
        className="flex items-center gap-4 px-8 py-5 select-none rounded-t-2xl bg-white/80 backdrop-blur border-b border-blue-100"
        style={{ minHeight: 72 }}
      >
        <div className="flex flex-col justify-center">
          <span
            className="text-2xl font-extrabold tracking-wide text-blue-700 leading-none"
            style={{ fontFamily: "Inter,Segoe UI,sans-serif" }}
          >
            {month.label}
          </span>
          <span className="text-xs text-slate-500 font-medium mt-1">
            {month.year}
          </span>
        </div>
        <div className="flex-1" />
        {!isAgent && (
          <div className="flex items-center gap-2 w-64 mr-4">
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Filter by Team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={t.label} value={t.value || "_all"}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3"
              onClick={() => setSelectedTeam("")}
            >
              Clear
            </Button>
          </div>
        )}
        <Button
          variant="default"
          size="sm"
          className="bg-green-600 hover:bg-green-700 h-9 px-4 mr-2"
          onClick={(e) => {
            e.stopPropagation();
            onExportMonth?.(month, filteredUsers);
          }}
        >
          Export Month
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="p-2 rounded-full hover:bg-blue-100 transition"
          title={expanded ? "Collapse" : "Expand"}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((prev) => !prev);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`lucide lucide-chevron-up w-5 h-5 transition-transform duration-200 ${expanded ? "" : "rotate-180"}`}
            aria-hidden="true"
          >
            <path d="m18 15-6-6-6 6"></path>
          </svg>
        </Button>
      </div>
      {expanded && (
        <div className="p-8 bg-white/90 rounded-b-2xl">
          <table className="min-w-full text-sm rounded-xl overflow-hidden shadow">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-blue-700">
                  User Name / Team
                </th>
                <th className="px-4 py-3 text-center font-semibold text-blue-700">
                  Billable Hour Delivered
                </th>
                <th className="px-4 py-3 text-center font-semibold text-blue-700">
                  Monthly Goal
                </th>
                <th className="px-4 py-3 text-center font-semibold text-blue-700">
                  Pending Target
                </th>
                <th className="px-4 py-3 text-center font-semibold text-blue-700">
                  Avg. QC Score
                </th>
                <th className="px-4 py-3 text-center font-semibold text-blue-700">
                  Export
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((row, idx) => (
                <tr
                  key={row.user_id ?? idx}
                  className="hover:bg-blue-50 transition group"
                >
                  <td className="px-4 py-3 text-black font-medium whitespace-nowrap">
                    {row.user_name}
                    {row.team_name ? ` / ${row.team_name}` : ""}
                  </td>
                  <td className="px-4 py-3 text-center text-black">
                    {row.total_billable_hours != null
                      ? Number(row.total_billable_hours).toFixed(2)
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-center text-black">
                    {row.monthly_target ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-center text-black">
                    {row.pending_target != null
                      ? Number(row.pending_target).toFixed(2)
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-center text-black">
                    {row.avg_qc_score != null
                      ? Number(row.avg_qc_score).toFixed(2)
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 h-8 px-3"
                      onClick={() => onExport(row)}
                    >
                      Export Daily
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
