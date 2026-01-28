/**
 * File: QAAgentList.jsx
 * Description: QA Agent List - Shows assigned agents with their tracker data (files only)
 */
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Download, FileText, Users as UsersIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../../../services/api";
import { useAuth } from "../../../../context/AuthContext";
import { log, logError } from "../../../../config/environment";

const QAAgentList = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedAgents, setExpandedAgents] = useState({});
  const [agentTrackers, setAgentTrackers] = useState({});

  // Store task names from dropdown API
  const [dropdownTaskNameMap, setDropdownTaskNameMap] = useState({});

  // Fetch agents, trackers, and task names from dropdown/get and dashboard/filter
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch task names from dropdown/get
        const dropdownRes = await api.post("/dropdown/get", {
          dropdown_type: "projects with tasks",
          logged_in_user_id: user?.user_id
        });
        const projectsWithTasks = dropdownRes.data?.data || [];
        const taskNameMap = {};
        projectsWithTasks.forEach(project => {
          (project.tasks || []).forEach(task => {
            taskNameMap[task.task_id] = task.task_name || task.label;
          });
        });
        setDropdownTaskNameMap(taskNameMap);

        log('[QAAgentList] Fetching dashboard/filter data');
        const payload = {
          logged_in_user_id: user?.user_id,
          device_id: user?.device_id || 'web123',
          device_type: user?.device_type || 'web',
        };
        const res = await api.post("/dashboard/filter", payload);
        const data = res.data?.data || {};
        
        let filteredAgents = [];
        let trackersByAgent = {};
        const role = String(user?.role_name || user?.user_role || '').toLowerCase();
        const allUsers = data.users || [];
        const allTrackers = data.tracker || [];

        if (role === 'assistant manager' || role.includes('assistant')) {
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
          filteredAgents = allUsers.filter(agent => myTeamIds.includes(String(agent.user_id)));
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
          filteredAgents = allUsers.filter(agent => myProjectIds.includes(String(agent.user_id)));
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
          filteredAgents = allUsers.filter(agent => myQAIds.includes(String(agent.user_id)));
        } else {
          filteredAgents = allUsers;
        }

        filteredAgents.forEach(agent => {
          trackersByAgent[agent.user_id] = allTrackers.filter(t => String(t.user_id) === String(agent.user_id) && t.tracker_file);
        });

        setAgents(filteredAgents);
        setAgentTrackers(trackersByAgent);
        log('[QAAgentList] Agents loaded:', filteredAgents.length);
      } catch (err) {
        logError('[QAAgentList] Error fetching dashboard/filter:', err);
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
  }, [user?.user_id, user?.device_id, user?.device_type, user?.role_name, user?.user_role]);

  // Toggle agent card expansion
  const toggleAgent = (agentId) => {
    const isExpanding = !expandedAgents[agentId];
    setExpandedAgents(prev => ({
      ...prev,
      [agentId]: isExpanding
    }));
  };

  // Handle QC Form action
  const handleQCForm = (tracker) => {
    log('[QAAgentList] Opening QC Form for tracker:', tracker.tracker_id);
    toast.success("QC Form functionality coming soon!");
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-8">
      <div className="mb-8 flex items-center gap-3">
        <UsersIcon className="w-8 h-8 text-blue-600" />
        <h2 className="text-3xl font-extrabold text-blue-800 tracking-tight drop-shadow-sm">Agent File Report</h2>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <span className="loader mb-4"></span>
          <span className="text-blue-600 font-semibold text-lg animate-pulse">Loading...</span>
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
          <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No assigned agents found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => {
            const isExpanded = expandedAgents[agent.user_id];
            const trackers = agentTrackers[agent.user_id] || [];

            return (
              <div
                key={agent.user_id}
                className="mb-4 rounded-2xl shadow-lg bg-linear-to-br from-blue-50 via-white to-slate-50 border border-slate-200 hover:shadow-2xl transition-shadow duration-300"
              >
                {/* Agent Card Header */}
                <div
                  className="flex items-center justify-between px-8 py-5 cursor-pointer select-none border-b border-slate-100 bg-linear-to-r from-blue-100/60 to-white/80 rounded-t-2xl"
                  onClick={() => toggleAgent(agent.user_id)}
                >
                  <div className="flex items-center gap-3">
                    <UsersIcon className="w-6 h-6 text-blue-700" />
                    <span className="font-bold text-blue-800 text-xl tracking-tight drop-shadow-sm">
                      {agent.user_name}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-block rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold mr-3 shadow-sm">
                      {trackers.length} file{trackers.length !== 1 ? 's' : ''}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-6 h-6 text-blue-600" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                </div>

                {/* Expanded Content - Tracker Table */}
                {isExpanded && (
                  <div className="p-8 bg-white rounded-b-2xl">
                    {trackers.length === 0 ? (
                      <div className="text-center text-slate-400 text-base py-8">No tracker data for this agent.</div>
                    ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm rounded-xl overflow-hidden shadow border border-slate-200">
                            <thead className="bg-linear-to-r from-blue-100 to-blue-50 border-b border-slate-200">
                              <tr>
                                <th className="px-5 py-3 text-left font-bold text-blue-800 uppercase tracking-wider">Date/Time</th>
                                <th className="px-5 py-3 text-left font-bold text-blue-800 uppercase tracking-wider">Agent Name</th>
                                <th className="px-5 py-3 text-left font-bold text-blue-800 uppercase tracking-wider">Project Name</th>
                                <th className="px-5 py-3 text-left font-bold text-blue-800 uppercase tracking-wider">Task Name</th>
                                <th className="px-5 py-3 text-center font-bold text-blue-800 uppercase tracking-wider">File</th>
                                <th className="px-5 py-3 text-center font-bold text-blue-800 uppercase tracking-wider">Action</th>
                              </tr>
                            </thead>
                              <tbody>
                                {trackers.map((tracker, index) => (
                                  <tr
                                    key={tracker.tracker_id || index}
                                    className="border-b border-slate-100 hover:bg-blue-50/60 transition-colors group"
                                  >
                                    <td className="px-5 py-3 text-slate-700 whitespace-nowrap">
                                      {tracker.date_time
                                        ? format(new Date(tracker.date_time), "M/d/yyyy h:mma")
                                        : "-"}
                                    </td>
                                    <td className="px-5 py-3 text-slate-700 font-bold whitespace-nowrap">
                                      {tracker.user_name || agent.user_name}
                                    </td>
                                    <td className="px-5 py-3 text-slate-700 whitespace-nowrap">
                                      {tracker.project_name || "-"}
                                    </td>
                                    <td className="px-5 py-3 text-slate-700 whitespace-nowrap">
                                      {tracker.task_name || dropdownTaskNameMap[tracker.task_id] || "-"}
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                      {tracker.tracker_file ? (
                                        <a
                                          href={tracker.tracker_file}
                                          download
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 group-hover:bg-blue-100 rounded-full p-2 shadow-sm cursor-pointer"
                                          title="Download file"
                                        >
                                          <Download className="w-5 h-5" />
                                        </a>
                                      ) : (
                                        <span className="text-slate-300">—</span>
                                      )}
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                      <button
                                        onClick={() => handleQCForm(tracker)}
                                        className="px-4 py-2 bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-2 mx-auto focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
                                      >
                                        <FileText className="w-4 h-4" />
                                        QC Form
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
