import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Filter,
  FileDown,
  Users as UsersIcon,
  RefreshCw,
  Plus,
  Calendar,
  Target,
  TrendingUp,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import api from "../../../../services/api";
import { useAuth } from "../../../../context/AuthContext";
import { log, logError } from "../../../../config/environment";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { createColumns, Tracker } from "./QATrackerReportColumns";
import {
  Agent,
  DropdownTaskMap,
  ProjectWithTasks,
  UserRef,
  ProjectRef,
} from "../../types";
import { getUsersList } from "../../../../services/qcService";
import AddTrackerModal from "./AddTrackerModal";
import {
  SearchableCombobox,
  SearchableComboboxItem,
} from "@/components/common/SearchableCombobox";

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

const QATrackerReport: React.FC = () => {
  const { user } = useAuth();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignedAgents, setAssignedAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [allAgents, setAllAgents] = useState<UserRef[]>([]);
  const [allProjects, setAllProjects] = useState<ProjectRef[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [selectedAgent, setSelectedAgent] = useState("");
  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState(getTodayDate());

  const [dropdownTaskMap, setDropdownTaskMap] = useState<DropdownTaskMap>({});

  // Create columns with the dropdownTaskMap
  const columns = useMemo(
    () => createColumns(dropdownTaskMap),
    [dropdownTaskMap],
  );

  const fetchData = useCallback(async () => {
    try {
      setLoadingAgents(true);
      setLoading(true);

      // Fetch agents list for "Add Tracker" form
      const agentsRes = await getUsersList({
        user_id: String(user?.user_id || ""),
        device_id: "DUMMY_ID",
        device_type: "DUMMY_TYPE",
      });
      if (agentsRes.data) {
        setAllAgents(agentsRes.data);
      }

      const dropdownRes = await api.post("/dropdown/get", {
        dropdown_type: "projects with tasks",
        logged_in_user_id: user?.user_id,
      });
      const projectsWithTasks: ProjectWithTasks[] =
        dropdownRes.data?.data || [];
      setAllProjects(projectsWithTasks);

      const taskMap: DropdownTaskMap = {};
      projectsWithTasks.forEach((project) => {
        (project.tasks || []).forEach((task) => {
          taskMap[String(task.task_id)] = task.task_target || 0;
        });
      });
      setDropdownTaskMap(taskMap);

      const payload: Record<string, unknown> = {
        logged_in_user_id: user?.user_id,
      };
      if (selectedAgent && selectedAgent !== "_all")
        payload.user_id = selectedAgent;
      if (startDate) payload.date_from = startDate;
      if (endDate) payload.date_to = endDate;

      log("[QATrackerReport] Fetching tracker/view data", payload);
      const res = await api.post("/tracker/view", payload);
      const data = res.data?.data || {};

      const fetchedTrackers: Tracker[] = Array.isArray(data.trackers)
        ? data.trackers
        : [];
      const monthSummary: Record<string, unknown>[] = Array.isArray(
        data.month_summary,
      )
        ? data.month_summary
        : [];

      setTrackers(fetchedTrackers);

      // Update assigned agents from summary if not filtered
      if (
        (!selectedAgent || selectedAgent === "_all") &&
        monthSummary.length > 0
      ) {
        const uniqueAgents: Agent[] = [];
        const seen = new Set<string>();
        monthSummary.forEach((s) => {
          const uid = String(s.user_id);
          if (!seen.has(uid)) {
            seen.add(uid);
            uniqueAgents.push({
              user_id: s.user_id as number,
              user_name: s.user_name as string,
            });
          }
        });
        setAssignedAgents(uniqueAgents);
      }

      log("[QATrackerReport] Trackers loaded:", fetchedTrackers.length);
    } catch (err) {
      logError("[QATrackerReport] Error fetching tracker/view:", err);
      toast.error("Failed to load tracker data");
      setAssignedAgents([]);
      setTrackers([]);
    } finally {
      setLoadingAgents(false);
      setLoading(false);
    }
  }, [user?.user_id, selectedAgent, startDate, endDate]);

  useEffect(() => {
    if (user?.user_id) {
      fetchData();
    }
  }, [user?.user_id, fetchData, refreshTrigger]);

  // API handles date/user filtering, so we just return the trackers
  const filteredTrackers = useMemo(() => {
    return trackers;
  }, [trackers]);

  const assignedAgentItems = useMemo<SearchableComboboxItem[]>(() => {
    const items: SearchableComboboxItem[] = [
      { value: "_all", label: "All Agents" },
    ];
    assignedAgents.forEach((a) => {
      items.push({
        value: String(a.user_id),
        label: a.user_name || "Unknown Agent",
      });
    });
    return items;
  }, [assignedAgents]);

  const handleClearFilters = () => {
    setSelectedAgent("");
    setStartDate(getTodayDate());
    setEndDate(getTodayDate());
  };

  const totals = useMemo(() => {
    const uniqueUserIds = new Set<string | number>();
    const baseTotals = filteredTrackers.reduce(
      (acc, tracker) => {
        if (tracker.user_id) uniqueUserIds.add(tracker.user_id);
        acc.tenureTarget += Number(tracker.tenure_target) || 0;
        acc.production += Number(tracker.production) || 0;
        acc.billableHours += Number(tracker.billable_hours) || 0;
        return acc;
      },
      { tenureTarget: 0, production: 0, billableHours: 0 },
    );

    const activeAgents = uniqueUserIds.size;
    const assignedHours = activeAgents * 9;

    return {
      ...baseTotals,
      activeAgents,
      assignedHours,
    };
  }, [filteredTrackers]);

  const handleExportToExcel = () => {
    if (filteredTrackers.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      const exportData = filteredTrackers.map((tracker) => ({
        "Date/Time": tracker.date_time
          ? (() => {
              const d = new Date(tracker.date_time);
              return isNaN(d.getTime())
                ? tracker.date_time
                : format(d, "M/d/yyyy h:mm a");
            })()
          : "-",
        Agent: tracker.user_name || "-",
        Project: tracker.project_name || "-",
        Task: tracker.task_name || "-",
        "Per Hour Target": tracker.tenure_target || 0,
        Production: tracker.production || 0,
        "Billable Hours":
          tracker.billable_hours !== null &&
          tracker.billable_hours !== undefined
            ? Number(tracker.billable_hours).toFixed(2)
            : "0.00",
        "Has File": tracker.tracker_file ? "Yes" : "No",
      }));

      exportData.push({
        "Date/Time": "",
        Agent: "",
        Project: "",
        Task: "TOTALS",
        "Per Hour Target": totals.tenureTarget.toFixed(2),
        Production: totals.production.toFixed(2),
        "Billable Hours": totals.billableHours.toFixed(2),
        "Has File": "",
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Tracker Report");

      const filename = `QA_Tracker_Report_${startDate}_to_${endDate}.xlsx`;

      XLSX.writeFile(workbook, filename);
      toast.success("Report exported successfully!");
      log("[QATrackerReport] Excel export completed:", filename);
    } catch (error) {
      logError("[QATrackerReport] Excel export error:", error);
      toast.error("Failed to export data");
    }
  };

  return (
    <div className="space-y-6 mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8 flex items-center gap-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <UsersIcon className="w-7 h-7 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">QA Tracker Report</h2>
          <p className="text-slate-600 mt-1">View and manage QA tracker</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="rounded-2xl p-6 mb-6 shadow border bg-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-700" />
            <h3 className="text-base font-bold text-blue-700 tracking-wide">
              Filters
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleExportToExcel}
              disabled={loading || filteredTrackers.length === 0}
              className="bg-green-600 hover:bg-green-700 h-9 px-4 flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              disabled={loading}
              className="h-9 px-4 flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 h-9 px-4 flex items-center gap-2 shadow-md shadow-blue-100"
            >
              <Plus className="w-4 h-4" />
              Add Tracker
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="h-9 px-4"
            >
              Clear Filters
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-blue-900 mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-blue-900 mb-1">
              End Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9"
            />
          </div>

          {/* Assigned Agent Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-blue-900 mb-1">
              Assigned Agent
            </label>
            <SearchableCombobox
              items={assignedAgentItems}
              value={selectedAgent || "_all"}
              onValueChange={setSelectedAgent}
              placeholder="Search Agent..."
              disabled={loadingAgents}
              className="h-9 rounded-md"
            />
            {loadingAgents && (
              <p className="text-xs text-gray-500 mt-1">Loading agents...</p>
            )}
          </div>
        </div>
      </div>

      {/* Reusable DataTable Component */}
      <DataTable
        columns={columns}
        data={filteredTrackers}
        loading={loading}
        loadingMessage="Loading tracker data..."
        emptyMessage="No tracker data found"
        emptyIcon={UsersIcon}
        showPagination={true}
        pageSize={10}
        containerClassName="rounded-2xl border border-slate-200 shadow-lg bg-white overflow-hidden"
        headerClassName=""
        rowClassName="border-b border-slate-100"
        rowHoverClassName="hover:bg-blue-50/60 transition-colors"
      />

      {/* Totals Summary Card */}
      {!loading && filteredTrackers.length > 0 && (
        <div className="mt-8 bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
            <span className="inline-block w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
            Summary Totals
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Active Agents */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-200 hover:shadow-md transition-all duration-300 group">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-tight">
                  Total Active Agents
                </p>
                <div className="p-1.5 rounded-lg bg-blue-100 transition-colors group-hover:bg-opacity-80">
                  <UsersIcon className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-black text-blue-700 tracking-tight">
                {totals.activeAgents}
              </p>
              <div className="h-1 w-full mt-3 rounded-full bg-blue-100 bg-opacity-30 overflow-hidden">
                <div className="h-full w-1/3 rounded-full bg-blue-600"></div>
              </div>
            </div>

            {/* Total Assigned Hours */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-200 hover:shadow-md transition-all duration-300 group">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-tight">
                  Total Assigned Hours
                </p>
                <div className="p-1.5 rounded-lg bg-orange-100 transition-colors group-hover:bg-opacity-80">
                  <Calendar className="w-4 h-4 text-orange-600" />
                </div>
              </div>
              <p className="text-2xl font-black text-orange-700 tracking-tight">
                {totals.assignedHours.toFixed(2)}
              </p>
              <div className="h-1 w-full mt-3 rounded-full bg-orange-100 bg-opacity-30 overflow-hidden">
                <div className="h-full w-1/3 rounded-full bg-orange-600"></div>
              </div>
            </div>

            {/* Total Per Hour Target */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-200 hover:shadow-md transition-all duration-300 group">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-tight">
                  Total Per Hour Target
                </p>
                <div className="p-1.5 rounded-lg bg-purple-100 transition-colors group-hover:bg-opacity-80">
                  <Target className="w-4 h-4 text-purple-600" />
                </div>
              </div>
              <p className="text-2xl font-black text-purple-700 tracking-tight">
                {totals.tenureTarget.toFixed(2)}
              </p>
              <div className="h-1 w-full mt-3 rounded-full bg-purple-100 bg-opacity-30 overflow-hidden">
                <div className="h-full w-1/3 rounded-full bg-purple-600"></div>
              </div>
            </div>

            {/* Total Production */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-teal-200 hover:shadow-md transition-all duration-300 group">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-tight">
                  Total Production
                </p>
                <div className="p-1.5 rounded-lg bg-teal-100 transition-colors group-hover:bg-opacity-80">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                </div>
              </div>
              <p className="text-2xl font-black text-teal-700 tracking-tight">
                {totals.production.toFixed(2)}
              </p>
              <div className="h-1 w-full mt-3 rounded-full bg-teal-100 bg-opacity-30 overflow-hidden">
                <div className="h-full w-1/3 rounded-full bg-teal-600"></div>
              </div>
            </div>

            {/* Total Billable Hours */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200 hover:shadow-md transition-all duration-300 group">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-tight">
                  Total Billable Hours
                </p>
                <div className="p-1.5 rounded-lg bg-green-100 transition-colors group-hover:bg-opacity-80">
                  <Clock className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-black text-green-700 tracking-tight">
                {totals.billableHours.toFixed(2)}
              </p>
              <div className="h-1 w-full mt-3 rounded-full bg-green-100 bg-opacity-30 overflow-hidden">
                <div className="h-full w-1/3 rounded-full bg-green-600"></div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add Tracker Modal */}
      <AddTrackerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
        agents={allAgents}
        projects={allProjects}
      />
    </div>
  );
};

export default QATrackerReport;
