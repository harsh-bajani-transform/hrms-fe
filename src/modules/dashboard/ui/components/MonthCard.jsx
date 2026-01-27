import React, { useState, useMemo } from "react";
import CustomSelect from "./CustomSelect";
import { useAuth } from "../../../../context/AuthContext";

export default function MonthCard({ month, users, onExport, onExportMonth, teamOptions = [] }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState("");
  const { user } = useAuth();
  
  // Check if user is an agent (role_id === 6)
  const isAgent = user?.role_id === 6 || user?.role_name === 'agent';

  // Use teamOptions from API if provided, else fallback to unique teams from users
  const teams = useMemo(() => {
    if (teamOptions.length > 0) return [{ label: "All Teams", value: "" }, ...teamOptions.map(t => ({ label: t.label, value: t.label }))];
    const unique = Array.from(new Set(users.map(u => u.team_name).filter(Boolean)));
    return [{ label: "All Teams", value: "" }, ...unique.map(team => ({ label: team, value: team }))];
  }, [users, teamOptions]);

  // Only filter by team if not agent
  const filteredUsers = !isAgent && selectedTeam
    ? users.filter((u) => u.team_name === selectedTeam)
    : users;

  return (
    <div className="relative bg-linear-to-br from-blue-50 via-white to-slate-100 border-l-8 border-blue-500 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 mb-6">
      <div
        className="flex items-center gap-4 px-8 py-5 select-none rounded-t-2xl bg-white/80 backdrop-blur border-b border-blue-100"
        style={{ minHeight: 72 }}
      >
        <div className="flex flex-col justify-center">
          <span className="text-2xl font-extrabold tracking-wide text-blue-700 leading-none" style={{fontFamily:'Inter,Segoe UI,sans-serif'}}>{month.label}</span>
          <span className="text-xs text-slate-500 font-medium mt-1">{month.year}</span>
        </div>
        <div className="flex-1" />
        {!isAgent && (
          <div className="flex items-center gap-2 w-64 mr-4">
            <CustomSelect
              value={selectedTeam}
              onChange={setSelectedTeam}
              options={teams}
              placeholder="Filter by Team"
            />
            <button
              className="px-2 py-1 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 text-xs font-semibold border border-gray-400 shadow-sm transition"
              onClick={() => setSelectedTeam("")}
              type="button"
            >
              Clear
            </button>
          </div>
        )}
        <button
          className="px-3 py-1 rounded bg-linear-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white text-xs font-semibold border border-green-700 shadow-sm transition mr-2"
          onClick={e => { e.stopPropagation?.(); if (onExportMonth) onExportMonth(month, filteredUsers); }}
        >
          Export Month
        </button>
        <button
          className="p-2 rounded-full hover:bg-blue-100 transition"
          title={expanded ? "Collapse" : "Expand"}
          aria-label={expanded ? "Collapse" : "Expand"}
          onClick={() => setExpanded((e) => !e)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-chevron-up w-5 h-5 transition-transform duration-200 ${expanded ? '' : 'rotate-180'}`} aria-hidden="true"><path d="m18 15-6-6-6 6"></path></svg>
        </button>
      </div>
      {expanded && (
        <div className="p-8 bg-white/90 rounded-b-2xl">
          <table className="min-w-full text-sm rounded-xl overflow-hidden shadow">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-blue-700">User Name / Team</th>
                <th className="px-4 py-3 text-center font-semibold text-blue-700">Billable Hour Delivered</th>
                <th className="px-4 py-3 text-center font-semibold text-blue-700">Monthly Goal</th>
                <th className="px-4 py-3 text-center font-semibold text-blue-700">Pending Target</th>
                <th className="px-4 py-3 text-center font-semibold text-blue-700">Avg. QC Score</th>
                <th className="px-4 py-3 text-center font-semibold text-blue-700">Export</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, idx) => (
                <tr key={user.user_id || idx} className="hover:bg-blue-50 transition group">
                  <td className="px-4 py-3 text-black font-medium whitespace-nowrap">
                    {user.user_name}{user.team_name ? ` / ${user.team_name}` : ''}
                  </td>
                  <td className="px-4 py-3 text-center text-black">{user.total_billable_hours ? Number(user.total_billable_hours).toFixed(2) : '-'}</td>
                  <td className="px-4 py-3 text-center text-black">{user.monthly_target ?? '-'}</td>
                  <td className="px-4 py-3 text-center text-black">{user.pending_target ? Number(user.pending_target).toFixed(2) : '-'}</td>
                  <td className="px-4 py-3 text-center text-black">{user.avg_qc_score ? Number(user.avg_qc_score).toFixed(2) : '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      className="px-3 py-1 rounded bg-linear-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white text-xs font-semibold border border-green-700 shadow-sm transition"
                      onClick={() => onExport(user)}
                    >
                      Export Daily
                    </button>
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
