import React, { useEffect, useState } from "react";
import AssistantManagerTabsNavigation from "./AssistantManagerTabsNavigation";
import { format } from "date-fns";
import { FileText, Users, Clock, TrendingUp, Download, Filter } from "lucide-react";

import api from "../../../../services/api";
import { getFriendlyErrorMessage } from '../../../../utils/errorMessages';
import ErrorMessage from '../../../../components/common/ErrorMessage';
import { useAuth } from "../../../../context/AuthContext";
import { useDeviceInfo } from '../../../../hooks/useDeviceInfo';
import BillableReport from "./BillableReport";
import QATrackerReport from './QATrackerReport';
import QAAgentList from './QAAgentList';

const AssistantManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();
  const { device_id, device_type } = useDeviceInfo();
  
  // By default, no date range (empty strings)
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  const [taskNameMap, setTaskNameMap] = useState({});

  const [stats, setStats] = useState({
    totalAgents: 0,
    qcPending: 0,
    billableHours: 0,
    avgQcScore: 0,
    latestQc: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch dropdowns for names
  useEffect(() => {
    const fetchNames = async () => {
      try {
        const [projRes, taskRes] = await Promise.all([
          api.post("/dropdown/get", { dropdown_type: "projects" }),
          api.post("/dropdown/get", { dropdown_type: "tasks" })
        ]);
        if (projRes.data?.status === 200) {
          // Project name map not currently used as we use row.project_name
        }
        if (taskRes.data?.status === 200) {
          const tMap = {};
          taskRes.data.data.forEach(t => tMap[String(t.task_id)] = t.label);
          setTaskNameMap(tMap);
        }
      } catch (err) {
        console.error("Failed to fetch name maps:", err);
      }
    };
    fetchNames();
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        // If no filter applied, show today's data only (but do not set date in filter UI)
        let payload = {
          logged_in_user_id: user?.user_id || user?.id,
          device_id: device_id || 'web_default',
          device_type: device_type || 'web',
        };

        if (dateRange.start && dateRange.end) {
          payload.date_from = dateRange.start;
          payload.date_to = dateRange.end;
        } else if (!dateRange.start && !dateRange.end) {
          // Default: show today's data only
          const today = format(new Date(), 'yyyy-MM-dd');
          payload.date_from = today;
          payload.date_to = today;
        }

        console.log('[AssistantManagerDashboard] 📤 Payload:', payload);
        const res = await api.post("/dashboard/filter", payload);
        console.log('[AssistantManagerDashboard] 🟢 API response:', res.data);
        
        if (res.data && res.data.status === 200) {
          const data = res.data.data || {};
          const summary = data.summary || {};
          const tracker = data.tracker || [];

          const latestQc = tracker
            .filter(row => !!row.tracker_file)
            .sort((a, b) => new Date(b.date_time) - new Date(a.date_time))
            .slice(0, 5)
            .map(row => ({
              ...row,
              user_name: row.user_name || '-',
              file_name: row.project_name || '-',
              qc_score: row.qc_score || '-',
              date: row.date_time ? row.date_time : '-',
              task_name: row.task_name || taskNameMap[String(row.task_id)] || '-',
            }));

          setStats({
            totalAgents: (data.users || []).length || summary.user_count || 0,
            qcPending: tracker.filter(row => row.tracker_file && row.qc_status === 'pending').length || summary.qc_pending || 0,
            billableHours: summary.total_billable_hours ? Number(summary.total_billable_hours).toFixed(2) : '0.00',
            avgQcScore: summary.avg_qc_score || '-',
            latestQc,
          });
        }
      } catch (err) {
        console.error('[AssistantManagerDashboard] Error fetching dashboard:', err);
        setError(getFriendlyErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    if (user?.user_id) {
       fetchDashboard();
    }
  }, [user, dateRange, device_id, device_type, taskNameMap]);

  const handleDateRangeChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage message={error} onRetry={() => {
           setError(null);
           setDateRange({...dateRange}); 
        }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          <span className="text-sm sm:text-base">Organization Analytics</span>
        </div>
        <div className="w-full grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-2 lg:flex lg:flex-row lg:gap-4 lg:w-auto">
          {/* Start Date */}
          <div className="col-span-2 sm:col-span-1 bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-row items-center gap-3">
            <label className="text-xs text-slate-500 uppercase font-bold">FROM</label>
            <input
              className="flex-1 bg-white border border-slate-300 text-slate-700 text-sm rounded px-2 py-1.5 outline-none"
              type="date"
              value={dateRange.start}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
              aria-label="Start date"
            />
          </div>
          {/* End Date */}
          <div className="col-span-2 sm:col-span-1 bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-row items-center gap-3">
            <label className="text-xs text-slate-500 uppercase font-bold">TO</label>
            <input
              className="flex-1 bg-white border border-slate-300 text-slate-700 text-sm rounded px-2 py-1.5 outline-none"
              type="date"
              value={dateRange.end}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
              aria-label="End date"
            />
          </div>
          {/* Clear Filter Button */}
          <button
            type="button"
            onClick={() => setDateRange({ start: '', end: '' })}
            className="col-span-2 sm:col-span-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg px-4 py-2 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-2 text-center flex flex-col items-center">
        <AssistantManagerTabsNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Stat Cards - Overview Only */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start border border-slate-100 transition-all hover:shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">Total Agents</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalAgents}</div>
            <div className="text-xs text-slate-400 mt-1">Assigned agents</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start border border-slate-100 transition-all hover:shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">Pending QC Files</span>
            </div>
            <div className="text-2xl font-bold">{stats.qcPending}</div>
            <div className="text-xs text-slate-400 mt-1">Files to review</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start border border-slate-100 transition-all hover:shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">Total Billable Hours</span>
            </div>
            <div className="text-2xl font-bold">{stats.billableHours}</div>
            <div className="text-xs text-slate-400 mt-1">Billable hours</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start border border-slate-100 transition-all hover:shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">Avg QC Score</span>
            </div>
            <div className="text-2xl font-bold">{stats.avgQcScore}</div>
            <div className="text-xs text-slate-400 mt-1">Average QC score</div>
          </div>
        </div>
      )}

      {/* Latest QC Done Files - Overview Only */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
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
            <div className="p-12 text-center text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
              No QC files found
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.latestQc.map((file, index) => (
                <div key={file.tracker_id || index} className="px-6 py-4 hover:bg-blue-50 transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Date/Time</p>
                      <p className="text-sm font-medium">{file.date_time}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Agent</p>
                      <p className="text-sm font-semibold">{file.user_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Project</p>
                      <p className="text-sm">{file.project_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Task</p>
                      <p className="text-sm">{file.task_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">File</p>
                      {file.tracker_file ? (
                        <a href={file.tracker_file} download target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          <Download className="w-3 h-3" /> Download
                        </a>
                      ) : '-'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Other Tabs */}
      {activeTab === 'billable_report' && (
        <div className="animate-fade-in">
          <BillableReport />
        </div>
      )}
      {activeTab === 'tracker_report' && (
        <div className="animate-fade-in">
          <QATrackerReport />
        </div>
      )}
      {activeTab === 'agent_file_report' && (
        <div className="animate-fade-in">
          <QAAgentList />
        </div>
      )}
    </div>
  );
};

export default AssistantManagerDashboard;
