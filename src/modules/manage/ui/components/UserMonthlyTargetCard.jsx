import React, { useState } from "react";
import dayjs from "dayjs";
import { Download, ChevronDown, Calendar, Briefcase } from "lucide-react";
import { toast } from "react-hot-toast";

// Dummy data for multiple months
const monthsData = [
  {
    key: '2025-12',
    label: 'DEC 2025',
    range: [dayjs('2025-12-01'), dayjs('2025-12-31')],
    agents: [
      { id: 1, userName: 'John Doe', workingDays: 22, dailyRequiredHours: 8, monthlyTotalTarget: 176, monthlyAchievedTarget: 150 },
      { id: 2, userName: 'Jane Smith', workingDays: 20, dailyRequiredHours: 7, monthlyTotalTarget: 140, monthlyAchievedTarget: 120 },
      { id: 3, userName: 'Alex Johnson', workingDays: 21, dailyRequiredHours: 8, monthlyTotalTarget: 168, monthlyAchievedTarget: 160 },
    ],
  },
  {
    key: '2026-01',
    label: 'JAN 2026',
    range: [dayjs('2026-01-01'), dayjs('2026-01-31')],
    agents: [
      { id: 4, userName: 'Emily Clark', workingDays: 21, dailyRequiredHours: 8, monthlyTotalTarget: 168, monthlyAchievedTarget: 140 },
      { id: 5, userName: 'Michael Brown', workingDays: 22, dailyRequiredHours: 7, monthlyTotalTarget: 154, monthlyAchievedTarget: 130 },
    ],
  },
  {
    key: '2026-02',
    label: 'FEB 2026',
    range: [dayjs('2026-02-01'), dayjs('2026-02-28')],
    agents: [
      { id: 6, userName: 'Sophia Lee', workingDays: 20, dailyRequiredHours: 8, monthlyTotalTarget: 160, monthlyAchievedTarget: 120 },
      { id: 7, userName: 'David Kim', workingDays: 19, dailyRequiredHours: 7, monthlyTotalTarget: 133, monthlyAchievedTarget: 110 },
    ],
  },
];

const UserMonthlyTargetCard = () => {
  // Expanded state for each month
  const [expanded, setExpanded] = useState(() => {
    const state = {};
    monthsData.forEach(m => { state[m.key] = true; });
    return state;
  });

  // Date range for each month
  const [dateRanges, setDateRanges] = useState(() => {
    const obj = {};
    monthsData.forEach(m => { obj[m.key] = m.range; });
    return obj;
  });

  // Editable state for each agent cell
  const [editState, setEditState] = useState({});
  const [editingCell, setEditingCell] = useState({ monthKey: null, agentId: null, field: null });

  const handleCellDoubleClick = (monthKey, agentId, field, value) => {
    setEditingCell({ monthKey, agentId, field });
    setEditState(prev => ({
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

  const handleEditChange = (e, monthKey, agentId, field) => {
    const value = e.target.value;
    setEditState(prev => ({
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

  const handleToggle = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRangeChange = (key, range) => {
    setDateRanges(prev => ({ ...prev, [key]: range }));
  };

  const handleExportExcel = (monthLabel) => {
    toast?.success(`Exporting ${monthLabel} data to Excel...`);
  };

  return (
    <div className="w-full space-y-6">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-indigo-700 tracking-tight">User Monthly Targets</h2>
        <p className="text-slate-500 text-sm">Review and manage monthly production goals for agents.</p>
      </div>

      {monthsData.map(month => (
        <div key={month.key} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100 gap-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <Calendar className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg text-slate-800 tracking-tight">{month.label}</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-slate-500 uppercase">
                  <span>From</span>
                  <input
                    className="bg-transparent text-slate-700 font-semibold outline-none cursor-pointer"
                    type="date"
                    value={dateRanges[month.key][0].format('YYYY-MM-DD')}
                    min={month.range[0].format('YYYY-MM-DD')}
                    max={month.range[1].format('YYYY-MM-DD')}
                    onChange={e => handleRangeChange(month.key, [dayjs(e.target.value), dateRanges[month.key][1]])}
                  />
                </div>
                <div className="w-px h-4 bg-slate-200" />
                <div className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-slate-500 uppercase">
                  <span>To</span>
                  <input
                    className="bg-transparent text-slate-700 font-semibold outline-none cursor-pointer"
                    type="date"
                    value={dateRanges[month.key][1].format('YYYY-MM-DD')}
                    min={month.range[0].format('YYYY-MM-DD')}
                    max={month.range[1].format('YYYY-MM-DD')}
                    onChange={e => handleRangeChange(month.key, [dateRanges[month.key][0], dayjs(e.target.value)])}
                  />
                </div>
              </div>

              <button
                onClick={() => handleExportExcel(month.label)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>

              <button
                onClick={() => handleToggle(month.key)}
                className={`p-2 rounded-full hover:bg-slate-200 transition-all text-slate-500 ${expanded[month.key] ? '' : 'rotate-180'}`}
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {expanded[month.key] && (
            <div className="p-0 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase tracking-wider text-[11px]">User Name</th>
                    <th className="px-6 py-4 text-center font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Working Days</th>
                    <th className="px-6 py-4 text-center font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Daily Required</th>
                    <th className="px-6 py-4 text-center font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Progress / Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {month.agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 text-slate-800 font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500">
                                {agent.userName.split(' ').map(n => n[0]).join('')}
                            </div>
                            {agent.userName}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 text-center text-slate-700 font-medium cursor-pointer"
                        onDoubleClick={() => handleCellDoubleClick(month.key, agent.id, 'workingDays', agent.workingDays)}
                      >
                        {editingCell.monthKey === month.key && editingCell.agentId === agent.id && editingCell.field === 'workingDays' ? (
                          <input
                            type="number"
                            className="border border-indigo-300 rounded px-2 py-1 w-16 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 text-center"
                            value={editState[month.key]?.[agent.id]?.workingDays ?? agent.workingDays}
                            autoFocus
                            onChange={e => handleEditChange(e, month.key, agent.id, 'workingDays')}
                            onBlur={handleEditSave}
                            onKeyDown={e => { if (e.key === 'Enter') handleEditSave(); }}
                          />
                        ) : (
                          agent.workingDays
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600">
                        {agent.dailyRequiredHours}h
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <span className="text-indigo-600">{agent.monthlyAchievedTarget}</span>
                            <span className="text-slate-300 font-normal">/</span>
                            <span>{agent.monthlyTotalTarget}</span>
                          </div>
                          <div className="w-24 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                            <div 
                                className="h-full bg-indigo-500 rounded-full" 
                                style={{ width: `${Math.min(100, (agent.monthlyAchievedTarget / agent.monthlyTotalTarget) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default UserMonthlyTargetCard;
