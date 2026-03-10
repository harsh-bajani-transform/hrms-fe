import React, { useState, useMemo, useEffect } from "react";
import {
  Users as UsersIcon,
  FileText,
  Search,
  RotateCcw,
  Calendar,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { createQATrackerColumns } from "./QAAgentListColumns";
import api from "../../../../services/api";
import { useAuth } from "../../../../context/AuthContext";
import { log, logError } from "../../../../config/environment";
import { toast } from "sonner";
import type {
  UserRef as Agent,
  TrackerRow as Tracker,
  ProjectRef as ProjectWithTasks,
} from "../../types";

interface DropdownTaskNameMap {
  [taskId: string]: string;
}

interface AgentTrackersMap {
  [userId: string]: Tracker[];
}

interface AgentFileReportViewProps {
  handleQCForm: (tracker: Tracker) => void;
  refreshTrigger: number;
}

const AgentFileReportView: React.FC<AgentFileReportViewProps> = ({
  handleQCForm,
  refreshTrigger,
}) => {
  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0] || "";
  };

  const getFirstDayOfMonth = () => {
    const today = new Date();
    return (
      new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split("T")[0] || ""
    );
  };

  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<
    string | number | null
  >(null);
  const [agentSearchQuery, setAgentSearchQuery] = useState("");
  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getTodayDate());
  const [agentTrackers, setAgentTrackers] = useState<AgentTrackersMap>({});
  const [dropdownTaskNameMap, setDropdownTaskNameMap] =
    useState<DropdownTaskNameMap>({});

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const dropdownRes = await api.post("/dropdown/get", {
          dropdown_type: "projects with tasks",
          logged_in_user_id: user?.user_id,
        });
        const projectsWithTasks: ProjectWithTasks[] =
          dropdownRes.data?.data || [];
        const taskNameMap: DropdownTaskNameMap = {};
        const projectMap: { [id: string]: string } = {};

        projectsWithTasks.forEach((project) => {
          if (project.project_id) {
            projectMap[String(project.project_id)] = project.project_name || "";
          }
          (project.tasks || []).forEach((task) => {
            const tName = task.task_name || task.label;
            taskNameMap[String(task.task_id)] = tName || "";
          });
        });
        setDropdownTaskNameMap(taskNameMap);

        log("[AgentFileReportView] Fetching tracker/view data");
        const payload: Record<string, unknown> = {
          logged_in_user_id: user?.user_id,
        };
        const trackerRes = await api.post("/tracker/view", payload);
        const trackerData = trackerRes.data?.data || {};
        let myTrackers: Tracker[] = trackerData.trackers || [];

        if (myTrackers.some((t) => t.qa_agent_id !== undefined)) {
          myTrackers = myTrackers.filter(
            (t) => String(t.qa_agent_id) === String(user?.user_id),
          );
        }

        const agentsMap: { [id: string]: Agent } = {};
        myTrackers.forEach((tracker) => {
          if (tracker.user_id && !agentsMap[String(tracker.user_id)]) {
            agentsMap[String(tracker.user_id)] = {
              user_id: tracker.user_id,
              user_name: tracker.user_name || "-",
            };
          }
        });
        const filteredAgents = Object.values(agentsMap);

        const trackersByAgent: AgentTrackersMap = {};
        filteredAgents.forEach((agent) => {
          trackersByAgent[String(agent.user_id)] = myTrackers
            .filter(
              (t) =>
                String(t.user_id) === String(agent.user_id) && t.tracker_file,
            )
            .map((tracker) => ({
              ...tracker,
              project_name:
                tracker.project_name ||
                (tracker.project_id
                  ? projectMap[String(tracker.project_id)]
                  : null) ||
                "-",
              task_name:
                tracker.task_name ||
                (tracker.task_id
                  ? taskNameMap[String(tracker.task_id)]
                  : null) ||
                "-",
              user_name: tracker.user_name || agent.user_name || "-",
            }));
        });

        setAgents(filteredAgents);
        setAgentTrackers(trackersByAgent);

        if (filteredAgents.length > 0 && !selectedAgentId) {
          const firstAgent = filteredAgents[0];
          if (
            firstAgent &&
            firstAgent.user_id !== undefined &&
            firstAgent.user_id !== null
          ) {
            setSelectedAgentId(firstAgent.user_id);
          }
        }
      } catch (err) {
        logError("[AgentFileReportView] Error fetching data:", err);
        toast.error("Failed to load agent data");
      } finally {
        setLoading(false);
      }
    };
    if (user?.user_id) {
      fetchDashboardData();
    }
  }, [user?.user_id, refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const columns = useMemo(
    () =>
      createQATrackerColumns({
        handleQCForm,
        dropdownTaskNameMap,
      }),
    [handleQCForm, dropdownTaskNameMap],
  );

  const filteredAgentsForSidebar = useMemo(() => {
    return agents.filter((a) =>
      a.user_name?.toLowerCase().includes(agentSearchQuery.toLowerCase()),
    );
  }, [agents, agentSearchQuery]);

  const selectedAgent = useMemo(() => {
    return (
      agents.find((a) => String(a.user_id) === String(selectedAgentId)) || null
    );
  }, [agents, selectedAgentId]);

  const selectedAgentTrackersFiltered = useMemo(() => {
    if (!selectedAgentId) return [];
    const trackers = agentTrackers[String(selectedAgentId)] || [];
    const sDate = startDate || getFirstDayOfMonth();
    const eDate = endDate || getTodayDate();

    return trackers.filter((t) => {
      if (!t.date_time) return false;
      try {
        const d = new Date(t.date_time);
        if (isNaN(d.getTime())) {
          const dateStr = String(t.date_time).slice(0, 10);
          return dateStr >= sDate && dateStr <= eDate;
        }
        const iso = d.toISOString();
        if (!iso) return false;
        const isoParts = iso.split("T");
        const isoStr = isoParts[0] || "";
        if (!isoStr) return false;
        return isoStr >= sDate && isoStr <= eDate;
      } catch {
        return false;
      }
    });
  }, [agentTrackers, selectedAgentId, startDate, endDate]);

  const handleResetToToday = () => {
    setStartDate(getTodayDate());
    setEndDate(getTodayDate());
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[850px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sidebar */}
      <Card className="w-full lg:w-80 h-full border-none shadow-xl backdrop-blur-sm flex flex-col">
        <div className="p-6 space-y-6 bg-blue-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <UsersIcon className="w-5 h-5 opacity-80" />
              <span className="font-bold text-lg">Agents</span>
            </div>
            <Badge className="bg-white/20 text-white border-none font-bold">
              {agents.length} Total
            </Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
            <Input
              value={agentSearchQuery}
              onChange={(e) => setAgentSearchQuery(e.target.value)}
              placeholder="Search agents..."
              className="pl-10 h-11 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:ring-0 focus:border-white/40 rounded-xl"
            />
          </div>
        </div>
        <ScrollArea className="flex-1 p-3 bg-white overflow-auto">
          <div className="space-y-2">
            {loading ? (
              <div className="py-20 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-slate-500 text-sm mt-4">Loading agents...</p>
              </div>
            ) : (
              filteredAgentsForSidebar.map((agent) => {
                const isSelected =
                  String(agent.user_id) === String(selectedAgentId);
                const fileCount = (agentTrackers[String(agent.user_id)] || [])
                  .length;

                return (
                  <div
                    key={agent.user_id}
                    onClick={() => setSelectedAgentId(agent.user_id || null)}
                    className={`
                    group flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200
                    ${
                      isSelected
                        ? "bg-white shadow-md border-l-4 border-blue-600 translate-x-1"
                        : "hover:bg-white hover:shadow-sm hover:translate-x-0.5"
                    }
                  `}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`
                      w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-colors
                      ${isSelected ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600 group-hover:bg-blue-200"}
                    `}
                      >
                        {agent.user_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm truncate max-w-[120px]">
                          {agent.user_name}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                          <FileText className="w-3 h-3" />
                          {fileCount} files
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Badge className="bg-blue-600 text-white px-2 py-0 border-none text-[10px] font-bold">
                        Selected
                      </Badge>
                    )}
                  </div>
                );
              })
            )}
            {!loading && filteredAgentsForSidebar.length === 0 && (
              <div className="text-center py-10">
                <Search className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">
                  No agents found
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Main Content Detail Area */}
      <div className="flex-1 h-full min-w-0">
        {selectedAgent ? (
          <div className="h-full animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Agent Detail Card */}
            <Card className="h-full border-none shadow-xl bg-white overflow-hidden flex flex-col">
              <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                {/* Fixed Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between p-8 gap-6 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                      <UsersIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {selectedAgent.user_name}
                      </h3>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge
                          variant="secondary"
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none px-3 py-1 font-bold flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {agentTrackers[String(selectedAgent.user_id)]
                            ?.length || 0}{" "}
                          Files Total
                        </Badge>
                        <span className="text-slate-400 text-sm font-medium">
                          •
                        </span>
                        <span className="text-slate-500 text-sm font-bold bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                          {startDate && endDate
                            ? `${startDate} to ${endDate}`
                            : "All Time"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fixed Filters Sub-section */}
                <div className="p-8 bg-slate-50/50 flex flex-col md:flex-row items-end gap-6 border-b border-slate-100 shrink-0">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <Calendar className="w-3 h-3" />
                        From Date
                      </label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-12 bg-white border-slate-200 focus:ring-blue-500 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <Calendar className="w-3 h-3" />
                        To Date
                      </label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-12 bg-white border-slate-200 focus:ring-blue-500 rounded-xl"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleResetToToday}
                    className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset to Today
                  </Button>
                </div>

                {/* Scrollable Data Table Area */}
                <ScrollArea className="flex-1 overflow-hidden">
                  <div className="overflow-x-auto p-8">
                    <DataTable
                      columns={columns}
                      data={selectedAgentTrackersFiltered}
                      loading={false}
                      emptyMessage="No files found for the selected date range."
                      showPagination={true}
                      pageSize={5}
                      containerClassName="border-none shadow-sm rounded-xl"
                    />
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <UsersIcon className="w-10 h-10 text-slate-300" />
            </div>
            <h4 className="text-xl font-bold text-slate-800">
              Select an Agent
            </h4>
            <p className="text-slate-500 font-medium mt-2 text-center max-w-sm">
              Choose an agent from the sidebar to view their tracked files and
              perform QC evaluations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentFileReportView;
