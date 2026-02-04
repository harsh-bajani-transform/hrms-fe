import React, { useEffect, useState, useMemo } from "react";
import { Filter, FileDown, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "../../../../context/AuthContext";
import { fetchDashboardData, fetchDropdownData } from "../../../dashboard/services/dashboardService";
import { Button } from "@/components/ui/button";
import type { TrackerRow, UserRef, ProjectRef, TaskRef, DashboardFilterPayload } from '../../../dashboard/types';
import { createColumns } from "./QATrackerReportViewColumns";

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0] ?? '';
};

interface DropdownTaskMap {
  [taskId: string]: number | string | undefined;
}

const QATrackerReportView: React.FC = () => {
  const { user } = useAuth();
  const [trackers, setTrackers] = useState<TrackerRow[]>([]);
  const [allTrackers, setAllTrackers] = useState<TrackerRow[]>([]); // Store all trackers for filtering
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [assignedAgents, setAssignedAgents] = useState<UserRef[]>([]);
  const [loadingAgents, setLoadingAgents] = useState<boolean>(false);

  // Filter states
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(getTodayDate());
  const [endDate, setEndDate] = useState<string>(getTodayDate());

  // Store per-hour targets from dropdown API
  const [dropdownTaskMap, setDropdownTaskMap] = useState<DropdownTaskMap>({});

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

        const projectsWithTasks = Array.isArray(dropdownRes?.data) ? dropdownRes.data as ProjectRef[] : [];
        const taskMap: DropdownTaskMap = {};
        projectsWithTasks.forEach((project: ProjectRef) => {
          (project.tasks || []).forEach((task: TaskRef) => {
            if (task.task_id != null) taskMap[String(task.task_id)] = task.task_target;
          });
        });
        setDropdownTaskMap(taskMap);

        const payload: DashboardFilterPayload = {
          logged_in_user_id: user?.user_id ?? '',
          device_id: typeof user?.device_id === 'string' ? user.device_id : 'web123',
          device_type: typeof user?.device_type === 'string' ? user.device_type : 'web',
        };

        const res = await fetchDashboardData(payload);
        const data = res?.data || {};

        let filteredAgents: UserRef[] = [];
        let filteredTrackers: TrackerRow[] = [];
        const role = String(user?.role_name || user?.user_role || '').toLowerCase();
        const allUsers: UserRef[] = Array.isArray(data.users) ? data.users : [];
        const allTrackersData: TrackerRow[] = Array.isArray(data.tracker) ? data.tracker : [];
        const allTasks: TaskRef[] = Array.isArray(data.tasks) ? data.tasks : [];

        const taskNameMap: { [taskId: string]: string } = {};
        allTasks.forEach((task: TaskRef) => {
          if (task.task_id != null) taskNameMap[String(task.task_id)] = task.task_name || "";
        });
        
        if (role === 'assistant manager') {
          let myTeamIds: string[] = [];
          if (data.projects) {
            data.projects.forEach(p => {
              if (p.asst_project_manager_id && user && p.asst_project_manager_id.includes(String(user.user_id))) {
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
          let myProjectIds: string[] = [];
          if (data.projects) {
            data.projects.forEach(p => {
              if (user && String(p.project_manager_id) === String(user.user_id)) {
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
          let myQAIds: string[] = [];
          if (data.projects) {
            data.projects.forEach(p => {
              if (p.project_qa_id && user && p.project_qa_id.includes(String(user.user_id))) {
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
          task_name: tracker.task_name || taskNameMap[String(tracker.task_id)] || "-"
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
    let filtered: TrackerRow[] = allTrackers;
    
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
    return trackers.reduce(
      (acc: { tenureTarget: number; production: number; billableHours: number }, tracker: TrackerRow) => {
        acc.tenureTarget += Number(tracker.tenure_target) || 0;
        acc.production += Number(tracker.production) || 0;
        acc.billableHours += Number(tracker.billable_hours) || 0;
        return acc;
      },
      { tenureTarget: 0, production: 0, billableHours: 0 }
    );
  }, [trackers]);

  // Export to Excel function
  const handleExportToExcel = () => {
    if (trackers.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      // Prepare data for export
      const exportData = trackers.map((tracker: TrackerRow) => ({
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

  // Create columns with dependencies
  const columns = useMemo(() => createColumns(dropdownTaskMap), [dropdownTaskMap]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Tracker Report</h2>
          </div>
          <Button
            onClick={handleExportToExcel}
            disabled={loading || trackers.length === 0}
            className="h-11 px-6 bg-green-600 hover:bg-green-700"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Filter className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Filter Options</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Start Date */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      
      {/* Main Table */}
      <DataTable
        columns={columns}
        data={trackers}
        loading={loading}
        emptyMessage="No tracker data found"
        emptyIcon={UsersIcon}
        showPagination={true}
        pageSize={10}
        headerClassName="bg-blue-50"
      />

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
