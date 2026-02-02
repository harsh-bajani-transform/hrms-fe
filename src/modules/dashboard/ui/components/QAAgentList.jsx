/**
 * File: QAAgentList.jsx
 * Description: QA Agent List - Shows assigned agents with their tracker data (files only)
 */
import React, { useEffect, useState } from "react";
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

  // Fetch agents, trackers, and task names from dropdown/get and tracker/view
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
        const taskNameMap = {}; // Map task_id -> task_name map
        const pMap = {}; // Map project_id -> project_name
        
        projectsWithTasks.forEach(project => {
          pMap[String(project.project_id)] = project.project_name;
          (project.tasks || []).forEach(task => {
             // Use task_name or label, consistent with source
             const tName = task.task_name || task.label;
             taskNameMap[String(task.task_id)] = tName;
          });
        });
        setDropdownTaskNameMap(taskNameMap);

        log('[QAAgentList] Fetching tracker/view data');
        const payload = {
          logged_in_user_id: user?.user_id,
        };
        // Source uses /tracker/view
        const trackerRes = await api.post("/tracker/view", payload);
        const trackerData = trackerRes.data?.data || {};
        let myTrackers = trackerData.trackers || [];

        // Source logic for filtering by qa_agent_id if present
        if (myTrackers.some(t => t.qa_agent_id !== undefined)) {
          myTrackers = myTrackers.filter(t => String(t.qa_agent_id) === String(user?.user_id));
        }

        // Build agents map from trackers
        const agentsMap = {};
        myTrackers.forEach(tracker => {
          // Verify we have a valid user_id
           if (tracker.user_id && !agentsMap[String(tracker.user_id)]) {
             agentsMap[String(tracker.user_id)] = {
               user_id: tracker.user_id,
               user_name: tracker.user_name || '-',
             };
           }
        });
        const filteredAgents = Object.values(agentsMap);

        // Build trackersByAgent map
        const trackersByAgent = {};
        filteredAgents.forEach(agent => {
          trackersByAgent[agent.user_id] = myTrackers
            .filter(t => String(t.user_id) === String(agent.user_id) && t.tracker_file)
            .map(tracker => ({
              ...tracker,
              // Ensure we have names, falling back to maps
              project_name: tracker.project_name || pMap[String(tracker.project_id)] || '-',
              task_name: tracker.task_name || taskNameMap[String(tracker.task_id)] || '-',
              user_name: tracker.user_name || agent.user_name || '-'
            }));
        });

        setAgents(filteredAgents);
        setAgentTrackers(trackersByAgent);
        log('[QAAgentList] Agents loaded:', filteredAgents.length);
      } catch (err) {
        logError('[QAAgentList] Error fetching data:', err);
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
  }, [user?.user_id]);

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
                                        ? (() => {
                                            const d = new Date(tracker.date_time);
                                            const pad = (n) => n.toString().padStart(2, '0');
                                            return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
                                          })()
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
