import React, { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Download, Filter, FileDown, Users as UsersIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import * as XLSX from 'xlsx';
import { useAuth } from "../../../../context/AuthContext";
import { fetchDashboardData, fetchDropdownData } from "../../../dashboard/services/dashboardService";

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const QATrackerReportView = () => {
  const { user } = useAuth();
  const [trackers, setTrackers] = useState([]);
  const [allTrackers, setAllTrackers] = useState([]); // Store all trackers for filtering
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [assignedAgents, setAssignedAgents] = useState([]);
  const [loadingAgents, setLoadingAgents] = useState(false);

  // Filter states
  const [selectedAgent, setSelectedAgent] = useState("");
  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState(getTodayDate());

  // Store per-hour targets from dropdown API
  const [dropdownTaskMap, setDropdownTaskMap] = useState({});

  // Fetch agents, trackers, and per-hour targets from dropdown/get and dashboard/filter
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoadingAgents(true);
        setLoading(true);
        
        // Fetch per-hour targets from dropdown/get
        const dropdownRes = await fetchDropdownData({
          dropdown_type: "projects with tasks",
          logged_in_user_id: user?.user_id
        });
        
        const projectsWithTasks = dropdownRes?.data || [];
        const taskMap = {};
        projectsWithTasks.forEach(project => {
          (project.tasks || []).forEach(task => {
            taskMap[task.task_id] = task.task_target;
          });
        });
        setDropdownTaskMap(taskMap);

        const payload = {
          logged_in_user_id: user?.user_id,
          device_id: user?.device_id || 'web123',
          device_type: user?.device_type || 'web',
        };
        
        const res = await fetchDashboardData(payload);
        const data = res?.data || {};
        
        let filteredAgents = [];
        let filteredTrackers = [];
        const role = String(user?.role_name || user?.user_role || '').toLowerCase();
        const allUsers = data.users || [];
        const allTrackersData = data.tracker || [];
        const allTasks = data.tasks || [];
        
        const taskNameMap = {};
        allTasks.forEach(task => {
          if (task.task_id != null) taskNameMap[task.task_id] = task.task_name;
        });
        
        if (role === 'assistant manager') {
          let myTeamIds = [];
          if (data.projects) {
            data.projects.forEach(p => {
              if (p.asst_project_manager_id && p.asst_project_manager_id.includes(String(user.user_id))) {
                if (p.project_team_id) {
                  const ids = p.project_team_id.replace(/\[|\]/g, '').split(',').map(x => x.trim()).filter(Boolean);
                  myTeamIds.push(...ids);
                }
              }
            });
          }
          filteredAgents = allUsers.filter(u => myTeamIds.includes(String(u.user_id)));
          filteredTrackers = allTrackersData.filter(t => myTeamIds.includes(String(t.user_id)));
        } else if (role === 'project manager') {
          let myProjectIds = [];
          if (data.projects) {
            data.projects.forEach(p => {
              if (String(p.project_manager_id) === String(user.user_id)) {
                if (p.project_team_id) {
                  const ids = p.project_team_id.replace(/\[|\]/g, '').split(',').map(x => x.trim()).filter(Boolean);
                  myProjectIds.push(...ids);
                }
              }
            });
          }
          filteredAgents = allUsers.filter(u => myProjectIds.includes(String(u.user_id)));
          filteredTrackers = allTrackersData.filter(t => myProjectIds.includes(String(t.user_id)));
        } else if (role === 'qa' || role === 'qa agent' || role === 'quality analyst') {
          let myQAIds = [];
          if (data.projects) {
            data.projects.forEach(p => {
              if (p.project_qa_id && p.project_qa_id.includes(String(user.user_id))) {
                if (p.project_team_id) {
                  const ids = p.project_team_id.replace(/\[|\]/g, '').split(',').map(x => x.trim()).filter(Boolean);
                  myQAIds.push(...ids);
                }
              }
            });
          }
          filteredAgents = allUsers.filter(u => myQAIds.includes(String(u.user_id)));
          filteredTrackers = allTrackersData.filter(t => myQAIds.includes(String(t.user_id)));
        } else {
          filteredAgents = allUsers;
          filteredTrackers = allTrackersData;
        }
        
        // Enrich trackers with task_name from taskNameMap
        filteredTrackers = filteredTrackers.map(tracker => ({
          ...tracker,
          task_name: tracker.task_name || taskNameMap[tracker.task_id] || "-"
        }));
        
        setAssignedAgents(filteredAgents);
        setAllTrackers(filteredTrackers);
        setTrackers(filteredTrackers);
      } catch (err) {
        console.error('[QATrackerReportView] Error fetching dashboard/filter:', err);
        toast.error("Failed to load agent/tracker data");
        setAssignedAgents([]);
        setAllTrackers([]);
        setTrackers([]);
      } finally {
        setLoadingAgents(false);
        setLoading(false);
      }
    };
    
    if (user?.user_id) {
      loadDashboardData();
    }
  }, [user?.user_id, user?.device_id, user?.device_type, user?.role_name, user?.user_role]);

  // Filter trackers by selected agent and date range
  useEffect(() => {
    if (!user?.user_id) return;
    
    setLoading(true);
    setError("");
    
    // Filter trackers in memory
    let filtered = allTrackers;
    
    if (selectedAgent) {
      filtered = filtered.filter(t => String(t.user_id) === String(selectedAgent));
    }
    if (startDate) {
      filtered = filtered.filter(t => t.date_time && t.date_time >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(t => t.date_time && t.date_time <= endDate + ' 23:59:59');
    }
    
    setTrackers(filtered);
    setLoading(false);
  }, [selectedAgent, startDate, endDate, allTrackers, user?.user_id]);

  // Clear filters
  const handleClearFilters = () => {
    setSelectedAgent("");
    setStartDate(getTodayDate());
    setEndDate(getTodayDate());
  };

  // Calculate totals from filtered trackers
  const totals = useMemo(() => {
    return trackers.reduce((acc, tracker) => {
      acc.tenureTarget += Number(tracker.tenure_target) || 0;
      acc.production += Number(tracker.production) || 0;
      acc.billableHours += Number(tracker.billable_hours) || 0;
      return acc;
    }, { tenureTarget: 0, production: 0, billableHours: 0 });
  }, [trackers]);

  // Export to Excel function
  const handleExportToExcel = () => {
    if (trackers.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      // Prepare data for export
      const exportData = trackers.map((tracker) => ({
        'Date/Time': tracker.date_time
          ? format(new Date(tracker.date_time), "M/d/yyyy h:mm a")
          : "-",
        'Agent': tracker.user_name || "-",
        'Project': tracker.project_name || "-",
        'Task': tracker.task_name || "-",
        'Per Hour Target': tracker.tenure_target || 0,
        'Production': tracker.production || 0,
        'Billable Hours': tracker.billable_hours !== null && tracker.billable_hours !== undefined
          ? Number(tracker.billable_hours).toFixed(2)
          : "0.00",
        'Has File': tracker.tracker_file ? 'Yes' : 'No'
      }));

      // Add totals row
      exportData.push({
        'Date/Time': '',
        'Agent': '',
        'Project': '',
        'Task': 'TOTALS',
        'Per Hour Target': totals.tenureTarget.toFixed(2),
        'Production': totals.production.toFixed(2),
        'Billable Hours': totals.billableHours.toFixed(2),
        'Has File': ''
      });

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Tracker Report");

      // Generate filename with date range
      const filename = `QA_Tracker_Report_${startDate}_to_${endDate}.xlsx`;

      // Download
      XLSX.writeFile(workbook, filename);
      toast.success("Report exported successfully!");
    } catch (error) {
      console.error('[QATrackerReportView] Excel export error:', error);
      toast.error("Failed to export data");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <UsersIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-800">Tracker Report</h2>
        </div>
        <button
          onClick={handleExportToExcel}
          disabled={loading || trackers.length === 0}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          title="Export filtered data to Excel"
        >
          <FileDown className="w-4 h-4" />
          Export to Excel
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-blue-50 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Filter className="w-4 h-4 text-blue-700" />
          <h3 className="text-sm font-semibold text-blue-700">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Start Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Assigned Agent Dropdown */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Assigned Agent
            </label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              disabled={loadingAgents}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">All Agents</option>
              {assignedAgents.map((agent) => (
                <option key={agent.user_id} value={agent.user_id}>
                  {agent.user_name}
                </option>
              ))}
            </select>
            {loadingAgents && (
              <p className="text-xs text-gray-500 mt-1">Loading agents...</p>
            )}
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="mt-2.5 flex justify-end">
          <button
            onClick={handleClearFilters}
            className="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium transition"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}
      
      {/* Scrollable table container */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto border border-slate-200 rounded-lg shadow-sm">
        <table className="min-w-full text-sm text-slate-700 table-fixed">
          <colgroup>
            <col style={{ width: '14%' }}/>
            <col style={{ width: '12%' }}/>
            <col style={{ width: '16%' }}/>
            <col style={{ width: '16%' }}/>
            <col style={{ width: '12%' }}/>
            <col style={{ width: '12%' }}/>
            <col style={{ width: '12%' }}/>
            <col style={{ width: '6%' }}/>
          </colgroup>
          <thead className="bg-blue-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 font-semibold text-left border-b border-slate-200">Date/Time</th>
              <th className="px-4 py-3 font-semibold text-left border-b border-slate-200">Agent</th>
              <th className="px-4 py-3 font-semibold text-left border-b border-slate-200">Project</th>
              <th className="px-4 py-3 font-semibold text-left border-b border-slate-200">Task</th>
              <th className="px-4 py-3 font-semibold text-left border-b border-slate-200">Per Hour Target</th>
              <th className="px-4 py-3 font-semibold text-left border-b border-slate-200">Production</th>
              <th className="px-4 py-3 font-semibold text-left border-b border-slate-200">Billable Hours</th>
              <th className="px-4 py-3 font-semibold text-center border-b border-slate-200">File</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="text-gray-500">Loading tracker data...</span>
                  </div>
                </td>
              </tr>
            ) : trackers.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <UsersIcon className="w-12 h-12 text-gray-300" />
                    <span className="text-gray-500 font-medium">No tracker data found</span>
                    <span className="text-gray-400 text-xs">Try adjusting your filters</span>
                  </div>
                </td>
              </tr>
            ) : trackers.map((tracker, index) => (
              <tr 
                key={tracker.tracker_id || index} 
                className="border-b border-slate-100 hover:bg-blue-50 transition-colors"
              >
                <td className="px-4 py-3 align-middle">
                  {tracker.date_time
                    ? format(new Date(tracker.date_time), "M/d/yyyy h:mma")
                    : "-"}
                </td>
                <td className="px-4 py-3 align-middle font-medium text-blue-700">
                  {tracker.user_name || "-"}
                </td>
                <td className="px-4 py-3 align-middle">
                  {tracker.project_name || "-"}
                </td>
                <td className="px-4 py-3 align-middle">
                  {tracker.task_name || "-"}
                </td>
                <td className="px-4 py-3 align-middle">
                  {tracker.tenure_target || dropdownTaskMap[tracker.task_id] || "0"}
                </td>
                <td className="px-4 py-3 align-middle font-semibold text-green-700">
                  {tracker.production || "0"}
                </td>
                <td className="px-4 py-3 align-middle font-semibold text-purple-700">
                  {tracker.billable_hours !== null && tracker.billable_hours !== undefined
                    ? Number(tracker.billable_hours).toFixed(2)
                    : "0.00"}
                </td>
                <td className="px-4 py-3 align-middle text-center">
                  {tracker.tracker_file ? (
                    <a
                      href={tracker.tracker_file}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 transition-colors"
                      title="Download file"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Summary Card */}
      {!loading && trackers.length > 0 && (
        <div className="mt-4 bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200 shadow-sm">
          <h3 className="text-sm font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
            Summary Totals
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Per Hour Target */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
              <p className="text-xs text-gray-600 mb-1 uppercase tracking-wide">Total Per Hour Target</p>
              <p className="text-2xl font-bold text-blue-700">{totals.tenureTarget.toFixed(2)}</p>
            </div>

            {/* Total Production */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100">
              <p className="text-xs text-gray-600 mb-1 uppercase tracking-wide">Total Production</p>
              <p className="text-2xl font-bold text-green-700">{totals.production.toFixed(2)}</p>
            </div>

            {/* Total Billable Hours */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
              <p className="text-xs text-gray-600 mb-1 uppercase tracking-wide">Total Billable Hours</p>
              <p className="text-2xl font-bold text-purple-700">{totals.billableHours.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QATrackerReportView;
