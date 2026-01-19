import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { FileText, Users, Clock, TrendingUp, Download, Filter } from "lucide-react";

import api from "../../../../services/api";
import { useAuth } from "../../../../context/AuthContext";
import { useDeviceInfo } from '../../../../hooks/useDeviceInfo';

const AssistantManagerDashboard = () => {
  const { user } = useAuth();
  const { device_id, device_type } = useDeviceInfo();
  const [dateRange, setDateRange] = useState({
    start: format(new Date(), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  });
  const [stats, setStats] = useState({
    totalAgents: 0,
    qcPending: 0,
    billableHours: 0,
    avgQcScore: 0,
    latestQc: [],
  });
  const [loading, setLoading] = useState(false);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const payload = {
          logged_in_user_id: user?.user_id || user?.id,
          device_id: device_id || 'web_default',
          device_type: device_type || 'web',
          start_date: dateRange.start,
          end_date: dateRange.end,
        };
        console.log('[AssistantManagerDashboard] 📤 Payload:', payload);
        const res = await api.post("/dashboard/filter", payload);
        console.log('[AssistantManagerDashboard] 🟢 API response:', res.data);
        if (res.data && res.data.status === 200) {
          const summary = res.data.data?.summary || {};
          const tracker = res.data.data?.tracker || [];
          const tasks = res.data.data?.tasks || [];
          const taskMap = {};
          tasks.forEach(task => {
            if (task.task_id) taskMap[task.task_id] = task.task_name || '-';
          });

          setStats({
            totalAgents: summary.user_count || 0,
            qcPending: summary.qc_pending || 0,
            billableHours: summary.total_billable_hours ? Number(summary.total_billable_hours).toFixed(2) : '0.00',
            avgQcScore: summary.avg_qc_score || 0,
            latestQc: tracker
              .filter(row => !!row.tracker_file)
              .map(row => ({
                ...row,
                file_name: row.project_name || '-',
                qc_score: row.qc_score || '-',
                date: row.date_time ? row.date_time.split(' ')[0] : '-',
                task_name: row.task_name || taskMap[row.task_id] || '-',
              })),
          });
        }
      } catch (err) {
        console.error('[AssistantManagerDashboard] Error fetching dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.user_id) {
       fetchDashboard();
    }
  }, [user, dateRange, device_id, device_type]);

  const handleDateRangeChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          <span className="text-sm sm:text-base">Organization Analytics</span>
        </div>
        <div className="flex flex-row items-center gap-3">
          <div className="flex flex-col items-start">
            <label className="text-xs text-slate-500 uppercase font-bold mb-1">FROM</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 text-sm rounded px-2 py-1.5 w-full outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              aria-label="Start date"
            />
          </div>
          <div className="flex flex-col items-start">
            <label className="text-xs text-slate-500 uppercase font-bold mb-1">TO</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 text-sm rounded px-2 py-1.5 w-full outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              aria-label="End date"
            />
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="font-semibold">Total Agents</span>
          </div>
          <div className="text-2xl font-bold">{stats.totalAgents}</div>
          <div className="text-xs text-slate-400 mt-1">Assigned agents</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <span className="font-semibold">Pending QC Files</span>
          </div>
          <div className="text-2xl font-bold">{stats.qcPending}</div>
          <div className="text-xs text-slate-400 mt-1">Files to review</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span className="font-semibold">Total Billable Hours</span>
          </div>
          <div className="text-2xl font-bold">{stats.billableHours}</div>
          <div className="text-xs text-slate-400 mt-1">Billable hours</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span className="font-semibold">Avg QC Score</span>
          </div>
          <div className="text-2xl font-bold">{stats.avgQcScore}</div>
          <div className="text-xs text-slate-400 mt-1">Average QC score</div>
        </div>
      </div>

      {/* Latest QC Done Files */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-blue-600 px-6 py-4 flex items-center gap-4 justify-start">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-lg">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <div className="flex flex-col justify-center text-left">
            <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">Latest QC Done Files</h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-0.5">Files recently reviewed for quality check</p>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-500">Loading QC files...</span>
            </div>
          </div>
        ) : stats.latestQc.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-blue-300" />
            </div>
            <p className="text-slate-600 font-medium text-lg mb-1">No QC files found</p>
            <p className="text-slate-400 text-sm">No QC files have been reviewed in this period.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {stats.latestQc.map((file, index) => (
              <div
                key={file.tracker_id || index}
                className="px-6 py-4 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 flex-1">
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Date/Time</p>
                        <p className="text-sm font-medium text-slate-700">
                          {file.date_time ? file.date_time.split(' ')[0] : '-'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {file.date_time ? file.date_time.split(' ')[1] : ''}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Agent</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {file.user_name || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Project</p>
                        <p className="text-sm text-slate-700">
                          {file.project_name || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Task</p>
                        <p className="text-sm text-slate-700">
                          {file.task_name || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">File</p>
                        {file.tracker_file ? (
                          <a
                            href={file.tracker_file}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        ) : (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssistantManagerDashboard;
