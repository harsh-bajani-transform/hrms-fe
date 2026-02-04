import React, { useEffect, useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Users as UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "../../../../context/AuthContext";
import {
  fetchDashboardData,
  fetchDropdownData,
} from "../../../dashboard/services/dashboardService";
import type { UserRef, TrackerRow, ProjectRef } from "../../../dashboard/types";
import type {
  QATaskNameMap as TaskNameMap,
  QAAgentTrackersMap as AgentTrackersMap,
  QAExpandedAgentsMap as ExpandedAgentsMap,
} from "../../types";
import { createColumns } from "./QAAgentListViewColumns";

const QAAgentListView: React.FC = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<UserRef[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedAgents, setExpandedAgents] = useState<ExpandedAgentsMap>({});
  const [agentTrackers, setAgentTrackers] = useState<AgentTrackersMap>({});
  const [dropdownTaskNameMap, setDropdownTaskNameMap] = useState<TaskNameMap>(
    {},
  );

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const dropdownRes = await fetchDropdownData({
          dropdown_type: "projects with tasks",
          logged_in_user_id: user?.user_id,
        });
        const projectsWithTasks: ProjectRef[] = Array.isArray(dropdownRes?.data)
          ? dropdownRes.data
          : [];
        const taskNameMap: TaskNameMap = {};
        projectsWithTasks.forEach((project) => {
          (project.tasks || []).forEach((task) => {
            if (task.task_id !== undefined) {
              taskNameMap[String(task.task_id)] =
                task.task_name || task.label || "";
            }
          });
        });
        setDropdownTaskNameMap(taskNameMap);

        if (!user?.user_id) throw new Error("User ID is required");
        const payload = {
          logged_in_user_id: user.user_id,
          device_id:
            typeof user.device_id === "string" ? user.device_id : "web123",
          device_type:
            typeof user.device_type === "string" ? user.device_type : "web",
        };
        const res = await fetchDashboardData(payload);
        const data = res?.data || {};
        let filteredAgents: UserRef[] = [];
        const trackersByAgent: AgentTrackersMap = {};
        const role = String(
          user?.role_name || user?.user_role || "",
        ).toLowerCase();
        const allUsers: UserRef[] = data.users || [];
        const allTrackers: TrackerRow[] = data.tracker || [];
        if (role === "assistant manager") {
          let myTeamIds: string[] = [];
          if (data.projects) {
            data.projects.forEach((p: ProjectRef) => {
              if (
                p.asst_project_manager_id &&
                user &&
                p.asst_project_manager_id.includes(String(user.user_id))
              ) {
                if (p.project_team_id) {
                  const ids = p.project_team_id
                    .replace(/\[|\]/g, "")
                    .split(",")
                    .map((x: string) => x.trim())
                    .filter(Boolean);
                  myTeamIds.push(...ids);
                }
              }
            });
          }
          filteredAgents = allUsers.filter(
            (u) =>
              u.user_id !== undefined && myTeamIds.includes(String(u.user_id)),
          );
        } else if (role === "project manager") {
          let myProjectIds: string[] = [];
          if (data.projects) {
            data.projects.forEach((p: ProjectRef) => {
              if (
                user &&
                String(p.project_manager_id) === String(user.user_id)
              ) {
                if (p.project_team_id) {
                  const ids = p.project_team_id
                    .replace(/\[|\]/g, "")
                    .split(",")
                    .map((x: string) => x.trim())
                    .filter(Boolean);
                  myProjectIds.push(...ids);
                }
              }
            });
          }
          filteredAgents = allUsers.filter(
            (u) =>
              u.user_id !== undefined &&
              myProjectIds.includes(String(u.user_id)),
          );
        } else if (
          role === "qa" ||
          role === "qa agent" ||
          role === "quality analyst"
        ) {
          let myQAIds: string[] = [];
          if (data.projects) {
            data.projects.forEach((p: ProjectRef) => {
              if (
                p.project_qa_id &&
                user &&
                p.project_qa_id.includes(String(user.user_id))
              ) {
                if (p.project_team_id) {
                  const ids = p.project_team_id
                    .replace(/\[|\]/g, "")
                    .split(",")
                    .map((x: string) => x.trim())
                    .filter(Boolean);
                  myQAIds.push(...ids);
                }
              }
            });
          }
          filteredAgents = allUsers.filter(
            (u) =>
              u.user_id !== undefined && myQAIds.includes(String(u.user_id)),
          );
        } else {
          filteredAgents = allUsers;
        }
        filteredAgents.forEach((agent) => {
          if (agent.user_id !== undefined) {
            trackersByAgent[String(agent.user_id)] = allTrackers.filter(
              (t) =>
                String(t.user_id) === String(agent.user_id) && t.tracker_file,
            );
          }
        });
        setAgents(filteredAgents);
        setAgentTrackers(trackersByAgent);
      } catch (err) {
        console.error(
          "[QAAgentListView] Error fetching dashboard/filter:",
          err,
        );
        toast.error("Failed to load agent data");
        setAgents([]);
        setAgentTrackers({});
      } finally {
        setLoading(false);
      }
    };
    if (user?.user_id) {
      loadDashboardData();
    }
  }, [
    user?.user_id,
    user?.device_id,
    user?.device_type,
    user?.role_name,
    user?.user_role,
  ]);

  const toggleAgent = (agentId: string | number | undefined) => {
    if (agentId === undefined) return;
    const isExpanding = !expandedAgents[String(agentId)];
    setExpandedAgents((prev) => ({
      ...prev,
      [String(agentId)]: isExpanding,
    }));
  };

  const handleQCForm = (tracker: TrackerRow) => {
    console.log(
      "[QAAgentListView] Opening QC Form for tracker:",
      tracker.tracker_id,
    );
    toast.success("QC Form functionality coming soon!");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <UsersIcon className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Agent List</h2>
        </div>
      </div>

      {loading ? (
        <Loading 
          title="Loading agents..." 
          description="Fetching QA agent data and performance metrics"
          fullHeight={false}
        />
      ) : agents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium text-lg">No assigned agents found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {agents.map((agent) => {
            const agentId =
              agent.user_id !== undefined ? String(agent.user_id) : undefined;
            const isExpanded = agentId ? expandedAgents[agentId] : false;
            const trackers = agentId ? agentTrackers[agentId] || [] : [];
            return (
              <div
                key={agentId}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div
                  onClick={() => toggleAgent(agentId)}
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white font-bold text-lg">
                        {agent.user_name
                          ? agent.user_name.charAt(0).toUpperCase()
                          : "-"}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {agent.user_name || "-"}
                      </h3>
                      <p className="text-sm text-gray-500">{trackers.length} tracker entries</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    {isExpanded ? (
                      <ChevronUp className="w-6 h-6 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-gray-600" />
                    )}
                  </button>
                </div>
                {isExpanded && (
                  <div className="border-t border-slate-200">
                    {trackers.length === 0 ? (
                      <div className="p-6 text-center">
                        <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">
                          No tracker data with files found
                        </p>
                      </div>
                    ) : (
                      <AgentTrackerTable
                        trackers={trackers}
                        agentName={agent.user_name || ""}
                        dropdownTaskNameMap={dropdownTaskNameMap}
                        handleQCForm={handleQCForm}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Separate component for agent tracker table
interface AgentTrackerTableProps {
  trackers: TrackerRow[];
  agentName: string;
  dropdownTaskNameMap: TaskNameMap;
  handleQCForm: (tracker: TrackerRow) => void;
}

const AgentTrackerTable: React.FC<AgentTrackerTableProps> = ({
  trackers,
  agentName,
  dropdownTaskNameMap,
  handleQCForm,
}) => {
  const columns = useMemo(
    () => createColumns(dropdownTaskNameMap, agentName, handleQCForm),
    [dropdownTaskNameMap, agentName, handleQCForm]
  );

  return (
    <DataTable
      columns={columns}
      data={trackers}
      emptyMessage="No tracker data with files found"
      emptyIcon={FileText}
      showPagination={true}
      pageSize={10}
      headerClassName="bg-slate-50"
    />
  );
};

export default QAAgentListView;
