import React, { useState } from "react";
import {
  Briefcase,
  Search,
  Plus,
  Edit2,
  Trash2,
  Target,
  User,
  ChevronDown,
  ChevronUp,
  Layers,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "../../../../context/AuthContext";
import { deleteProject, deleteTask } from "../../services/manageService";
import { fetchProjectsList } from "../../../dashboard/services/projectService";

import ProjectFormModal from "./ProjectFormModal";
import TaskFormModal from "./TaskFormModal";
import { UserDropdowns } from "../../../../hooks/useUserDropdowns";
import type { ProjectType, TaskType } from "../../types";

interface ProjectsManagementProps {
  projects: ProjectType[];
  loading: boolean;
  onRefresh: () => void;
  dropdowns: UserDropdowns;
}

const ProjectsManagement: React.FC<ProjectsManagementProps> = ({
  projects,
  loading,
  onRefresh,
  dropdowns,
}) => {
  const { canManageProjects, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectType | null>(
    null,
  );
  const [expandedProjectId, setExpandedProjectId] = useState<
    string | number | null
  >(null);
  const [taskModalState, setTaskModalState] = useState<{
    isOpen: boolean;
    project: ProjectType | null;
    task: TaskType | null;
  }>({ isOpen: false, project: null, task: null });

  const filteredProjects = projects.filter((p) =>
    p.project_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDeleteProject = async (proj: ProjectType) => {
    if (
      !window.confirm(
        `Are you sure you want to delete project: ${proj.project_name}?`,
      )
    )
      return;
    try {
      await deleteProject(proj.project_id);
      toast.success("Project deleted successfully");
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleDeleteTask = async (
    projectId: string | number,
    task: TaskType,
  ) => {
    if (
      !window.confirm(
        `Are you sure you want to delete task: ${task.task_name}?`,
      )
    )
      return;
    try {
      await deleteTask({ project_id: projectId, task_id: task.task_id });
      toast.success("Task deleted successfully");
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleDownloadFile = async (project: ProjectType) => {
    try {
      const res = await fetchProjectsList(user?.user_id);
      const projectsList = res.data || [];

      const current = projectsList.find(
        (p) => String(p.project_id) === String(project.project_id),
      );

      if (!current) {
        toast.error("Project not found in latest list.");
        return;
      }

      if (!current.project_file || current.project_file === "null") {
        toast.error("No file available for this project.");
        return;
      }

      const filePath = current.project_file;
      const fileName =
        filePath.split(/[\\/]/).filter(Boolean).pop() || "project-file";

      const link = document.createElement("a");
      link.href = filePath;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download file.");
    }
  };

  const openTaskModal = (
    project: ProjectType,
    task: TaskType | null = null,
  ) => {
    setTaskModalState({
      isOpen: true,
      project,
      task,
    });
  };

  const closeTaskModal = () => {
    setTaskModalState({
      isOpen: false,
      project: null,
      task: null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search projects..."
            className="w-full pl-10 h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {canManageProjects && (
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 h-11 px-4"
          >
            <Plus className="w-4 h-4" />
            Add New Project
          </Button>
        )}
      </div>

      {/* Projects List with Accordion */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <span className="text-gray-600 font-medium">
              Loading projects...
            </span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-20 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No projects found</p>
          </div>
        ) : (
          <Accordion
            type="single"
            collapsible
            value={expandedProjectId?.toString() || ""}
            onValueChange={(val) => setExpandedProjectId(val || null)}
            className="space-y-4"
          >
            {filteredProjects.map((p) => (
              <AccordionItem
                key={p.project_id}
                value={p.project_id.toString()}
                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border-none"
              >
                <div className="p-1 px-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 py-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {p.project_name}
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Target className="w-3.5 h-3.5" />
                          Target:{" "}
                          <span className="font-semibold text-gray-700">
                            {p.monthly_hours_target || 0} hrs
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Layers className="w-3.5 h-3.5" />
                          Tasks:{" "}
                          <span className="font-semibold text-gray-700">
                            {p.tasks?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <AccordionTrigger className="hover:no-underline py-0">
                      <span className="text-xs font-semibold text-blue-600 px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-all decoration-0">
                        {expandedProjectId?.toString() ===
                        p.project_id.toString()
                          ? "Hide Details"
                          : "View Details"}
                      </span>
                    </AccordionTrigger>
                    <div className="flex items-center gap-2 border-l border-slate-100 pl-3">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadFile(p);
                        }}
                        className="text-slate-400 hover:text-blue-600 hover:bg-slate-50"
                        title="Download Project File"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {canManageProjects && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingProject(p);
                            }}
                            className="text-slate-400 hover:text-indigo-600 hover:bg-slate-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(p);
                            }}
                            className="text-slate-400 hover:text-rose-600 hover:bg-slate-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <AccordionContent className="border-t border-slate-50 bg-slate-50/50 p-6 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-6">
                    <Card>
                      <CardHeader className="p-4 pb-2">
                        <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Team Owner
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-indigo-500" />
                          <span className="text-sm font-bold text-slate-700">
                            {p.owner_name || "Not assigned"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="p-4 pb-2">
                        <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Assistant Manager
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-indigo-500" />
                          <span className="text-sm font-bold text-slate-700">
                            {p.apm_name || "Not assigned"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="p-4 pb-2">
                        <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          QA Owner
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-indigo-500" />
                          <span className="text-sm font-bold text-slate-700">
                            {p.qa_name || "Not assigned"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-500" /> Project
                        Tasks
                      </h4>
                      {canManageProjects && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => openTaskModal(p)}
                          className="h-auto p-0 text-[10px] font-bold text-indigo-600 uppercase tracking-wider hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add Task
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {p.tasks && p.tasks.length > 0 ? (
                        p.tasks.map((t) => (
                          <div
                            key={t.task_id}
                            className="bg-white px-4 py-3 rounded-lg border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-colors"
                          >
                            <div
                              className="flex-1 mr-2 cursor-pointer"
                              onClick={() =>
                                canManageProjects && openTaskModal(p, t)
                              }
                            >
                              <span className="text-sm text-slate-600 font-medium group-hover:text-indigo-600 transition-colors">
                                {t.task_name}
                              </span>
                              {typeof t.task_target === "string" ||
                              typeof t.task_target === "number" ? (
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Target: {t.task_target} hrs
                                </div>
                              ) : null}
                            </div>
                            {canManageProjects && (
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(p.project_id, t);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full py-4 text-center text-xs text-slate-400 italic">
                          No tasks added to this project.
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Modals */}
      {(showAddModal || editingProject) && (
        <ProjectFormModal
          project={editingProject ?? undefined}
          onClose={() => {
            setShowAddModal(false);
            setEditingProject(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingProject(null);
            onRefresh();
          }}
          dropdowns={dropdowns}
        />
      )}

      {/* Task Modal */}
      {taskModalState.isOpen && (
        <TaskFormModal
          task={taskModalState.task ?? undefined}
          onClose={closeTaskModal}
          onSuccess={() => {
            closeTaskModal();
            onRefresh();
          }}
          dropdowns={{
            users: dropdowns.agents.map((a) => ({
              ...a,
              label:
                typeof a.label === "string"
                  ? a.label
                  : String(a.user_name || a.id || a.user_id || ""),
            })),
            projects: projects.map((p) => ({
              project_id: p.project_id,
              label: p.project_name || String(p.project_id),
            })),
          }}
        />
      )}
    </div>
  );
};

export default ProjectsManagement;
