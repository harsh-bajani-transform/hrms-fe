import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Users as UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/ui/pagination";
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
        <div className="flex justify-center items-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
            <span className="text-gray-600 font-medium">Loading agents...</span>
          </div>
        </div>
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
                      <>
                        {(() => {
                          const columns: ColumnDef<TrackerRow, unknown>[] = [
                            {
                              id: "dateTime",
                              header: "Date/Time",
                              cell: ({ row }) => (
                                <div className="text-slate-700">
                                  {row.original.date_time
                                    ? format(
                                        new Date(row.original.date_time),
                                        "M/d/yyyy h:mma",
                                      )
                                    : "-"}
                                </div>
                              ),
                            },
                            {
                              id: "agentName",
                              header: "Agent Name",
                              cell: ({ row }) => (
                                <div className="text-slate-700 font-medium">
                                  {row.original.user_name ||
                                    agent.user_name ||
                                    "-"}
                                </div>
                              ),
                            },
                            {
                              id: "projectName",
                              header: "Project Name",
                              cell: ({ row }) => (
                                <div className="text-slate-700">
                                  {row.original.project_name || "-"}
                                </div>
                              ),
                            },
                            {
                              id: "taskName",
                              header: "Task Name",
                              cell: ({ row }) => (
                                <div className="text-slate-700">
                                  {row.original.task_name ||
                                    (row.original.task_id !== undefined
                                      ? dropdownTaskNameMap[
                                          String(row.original.task_id)
                                        ]
                                      : undefined) ||
                                    "-"}
                                </div>
                              ),
                            },
                            {
                              id: "file",
                              header: () => <div className="text-center">File</div>,
                              cell: ({ row }) => (
                                <div className="text-center">
                                  {row.original.tracker_file ? (
                                    <a
                                      href={row.original.tracker_file}
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
                                </div>
                              ),
                            },
                            {
                              id: "action",
                              header: () => <div className="text-center">Action</div>,
                              cell: ({ row }) => (
                                <div className="text-center">
                                  <Button
                                    onClick={() => handleQCForm(row.original)}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3"
                                  >
                                    <FileText className="w-3.5 h-3.5 mr-1.5" />
                                    QC Form
                                  </Button>
                                </div>
                              ),
                            },
                          ];

                          const table = useReactTable({
                            data: trackers,
                            columns,
                            getCoreRowModel: getCoreRowModel(),
                            getPaginationRowModel: getPaginationRowModel(),
                            initialState: {
                              pagination: { pageSize: 10 },
                            },
                          });

                          return (
                            <>
                              <Table>
                                <TableHeader className="bg-slate-50 border-b border-slate-200">
                                  {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                      {headerGroup.headers.map((header) => (
                                        <TableHead
                                          key={header.id}
                                          className="font-semibold text-slate-700 h-12"
                                        >
                                          {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext(),
                                          )}
                                        </TableHead>
                                      ))}
                                    </TableRow>
                                  ))}
                                </TableHeader>
                                <TableBody>
                                  {table.getRowModel().rows.map((row) => (
                                    <TableRow
                                      key={row.id}
                                      className="border-b border-slate-100 hover:bg-blue-50 transition-colors"
                                    >
                                      {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                          {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext(),
                                          )}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                              <div className="border-t border-slate-200">
                                <DataTablePagination table={table} />
                              </div>
                            </>
                          );
                        })()}
                      </>
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

export default QAAgentListView;
