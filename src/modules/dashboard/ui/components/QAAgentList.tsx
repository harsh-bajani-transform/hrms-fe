import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";
import api from "../../../../services/api";
import { useAuth } from "../../../../context/AuthContext";
import { log, logError } from "../../../../config/environment";
import { DataTable } from "@/components/ui/data-table";
import { createQATrackerColumns } from "./QAAgentListColumns";
import DailyEntryFormModal from "../../../../components/common/DailyEntryFormModal";

import type {
  UserRef as Agent,
  TrackerRow as Tracker,
  ProjectRef as ProjectWithTasks,
  TaskRef as ProjectTask,
} from "../../types";

interface DropdownTaskNameMap {
  [taskId: string]: string;
}

interface AgentTrackersMap {
  [userId: string]: Tracker[];
}

interface ExpandedAgentsMap {
  [userId: string]: boolean;
}

const QAAgentList: React.FC = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedAgents, setExpandedAgents] = useState<ExpandedAgentsMap>({});
  const [agentTrackers, setAgentTrackers] = useState<AgentTrackersMap>({});
  const [dropdownTaskNameMap, setDropdownTaskNameMap] =
    useState<DropdownTaskNameMap>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState<Tracker | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch task names from dropdown/get
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
            // Use task_name or label, consistent with source
            const tName = task.task_name || task.label;
            taskNameMap[String(task.task_id)] = tName || "";
          });
        });
        setDropdownTaskNameMap(taskNameMap);

        log("[QAAgentList] Fetching tracker/view data");
        const payload: Record<string, unknown> = {
          logged_in_user_id: user?.user_id,
        };
        const trackerRes = await api.post("/tracker/view", payload);
        const trackerData = trackerRes.data?.data || {};
        let myTrackers: Tracker[] = trackerData.trackers || [];

        // Source logic for filtering by qa_agent_id if present
        // Note: Tracker interface might need 'qa_agent_id'
        if (myTrackers.some((t) => t.qa_agent_id !== undefined)) {
          myTrackers = myTrackers.filter(
            (t) => String(t.qa_agent_id) === String(user?.user_id),
          );
        }

        // Build agents map from trackers
        const agentsMap: { [id: string]: Agent } = {};
        myTrackers.forEach((tracker) => {
          // Verify we have a valid user_id
          if (tracker.user_id && !agentsMap[String(tracker.user_id)]) {
            agentsMap[String(tracker.user_id)] = {
              user_id: tracker.user_id,
              user_name: tracker.user_name || "-",
            };
          }
        });
        const filteredAgents = Object.values(agentsMap);

        // Build trackersByAgent map
        const trackersByAgent: AgentTrackersMap = {};
        filteredAgents.forEach((agent) => {
          trackersByAgent[String(agent.user_id)] = myTrackers
            .filter(
              (t) =>
                String(t.user_id) === String(agent.user_id) && t.tracker_file,
            )
            .map((tracker) => ({
              ...tracker,
              // Ensure we have names, falling back to maps
              project_name:
                tracker.project_name ||
                projectMap[String(tracker.project_id)] ||
                "-",
              task_name:
                tracker.task_name ||
                taskNameMap[String(tracker.task_id)] ||
                "-",
              user_name: tracker.user_name || agent.user_name || "-",
            }));
        });

        setAgents(filteredAgents);
        setAgentTrackers(trackersByAgent);
        log("[QAAgentList] Agents loaded:", filteredAgents.length);
      } catch (err) {
        logError("[QAAgentList] Error fetching data:", err);
        toast.error("Failed to load agent data");
        setAgents([]);
        setAgentTrackers({});
      } finally {
        setLoading(false);
      }
    };
    if (user?.user_id) {
      fetchDashboardData();
    }
  }, [user?.user_id, refreshTrigger]);

  const toggleAgent = React.useCallback((agentId: number | string) => {
    setExpandedAgents((prev) => ({
      ...prev,
      [agentId]: !prev[agentId],
    }));
  }, []);

  const handleQCForm = React.useCallback((tracker: Tracker) => {
    log("[QAAgentList] Opening QC Form for tracker:", tracker.tracker_id);
    setSelectedTracker(tracker);
    setIsModalOpen(true);
  }, []);

  const columns = React.useMemo(
    () =>
      createQATrackerColumns({
        handleQCForm,
        dropdownTaskNameMap,
      }),
    [handleQCForm, dropdownTaskNameMap],
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="p-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <UsersIcon className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Agent File Report</h2>
            <p className="text-slate-600 mt-1">View and manage agent files</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <span className="text-gray-600 font-medium">Loading agents...</span>
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium text-lg">
            No assigned agents found
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {agents.map((agent) => {
            if (agent.user_id === undefined) return null;
            const isExpanded = expandedAgents[agent.user_id];
            const trackers = agentTrackers[agent.user_id] || [];

            return (
              <div
                key={agent.user_id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Agent Card Header */}
                <div
                  className="flex items-center justify-between px-6 py-5 cursor-pointer select-none bg-white border-b border-gray-100 hover:bg-slate-50 transition-colors"
                  onClick={() => {
                    if (agent.user_id !== undefined) {
                      toggleAgent(agent.user_id);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <UsersIcon className="w-6 h-6 text-slate-400" />
                    <span className="font-semibold text-slate-900 text-lg tracking-tight">
                      {agent.user_name}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-block rounded-full bg-slate-100 text-slate-600 px-3 py-1 text-xs font-medium mr-3 border border-slate-200">
                      {trackers.length} file{trackers.length !== 1 ? "s" : ""}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Content - Tracker Table */}
                {isExpanded && (
                  <div className="p-8 bg-white rounded-b-2xl">
                    {trackers.length === 0 ? (
                      <div className="text-center text-slate-400 text-base py-8">
                        No tracker data for this agent.
                      </div>
                    ) : (
                      <DataTable
                        columns={columns}
                        data={trackers}
                        loading={false}
                        emptyMessage="No tracker data for this agent."
                        showPagination={true}
                        pageSize={5}
                        containerClassName="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white"
                        headerClassName="bg-slate-50/80"
                        rowClassName="border-slate-100"
                        rowHoverClassName="hover:bg-blue-50/50 transition-colors"
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedTracker && (
        <DailyEntryFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTracker(null);
          }}
          onSubmit={() => {
            setRefreshTrigger((prev) => prev + 1);
          }}
          isEditMode={
            !!(selectedTracker?.qc_score || selectedTracker?.assigned_hours)
          }
          initialData={{
            ...(selectedTracker?.qc_score !== undefined &&
              selectedTracker?.qc_score !== null && {
                qcScore: selectedTracker.qc_score as string | number,
              }),
            ...(selectedTracker?.assigned_hours !== undefined &&
              selectedTracker?.assigned_hours !== null && {
                assignHours: selectedTracker.assigned_hours as string | number,
              }),
          }}
          user={{
            user_id: (selectedTracker?.user_id as string | number) || "",
            user_name: selectedTracker?.user_name || "",
          }}
          userId={(selectedTracker?.user_id as string | number) || ""}
          date={
            selectedTracker?.date_time
              ? selectedTracker.date_time.slice(0, 10)
              : null
          }
        />
      )}

      {/* Loader spinner style */}
      <style>{`
				.loader {
					border: 4px solid #e0e7ef;
					border-top: 4px solid #2563eb;
					border-radius: 50%;
					width: 36px;
					height: 36px;
					animation: spin 1s linear infinite;
				}
				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
			`}</style>
    </div>
  );
};

export default QAAgentList;
