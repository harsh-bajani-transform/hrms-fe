import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { fetchProjectTasks } from "../../services/manageService";
import { TaskType, ProjectType } from "../../types";
import { toast } from "sonner";

interface ProjectTasksProps {
  project: ProjectType;
  canManageProjects: boolean;
  openTaskModal: (project: ProjectType, task?: TaskType) => void;
  handleDeleteTask: (projectId: string | number, task: TaskType) => void;
}

const ProjectTasks: React.FC<ProjectTasksProps> = ({
  project,
  canManageProjects,
  openTaskModal,
  handleDeleteTask,
}) => {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchProjectTasks(project.project_id);
      if (res.status === 200) {
        setTasks(res.data || []);
      } else {
        setError("Failed to load tasks");
      }
    } catch (err: unknown) {
      console.error("Error fetching tasks:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred while fetching tasks";
      setError(errorMessage);
      toast.error("Failed to load project tasks");
    } finally {
      setLoading(false);
    }
  }, [project.project_id]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const columns = useMemo<ColumnDef<TaskType>[]>(
    () => [
      {
        accessorKey: "task_name",
        header: "Task Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="bg-indigo-50 p-1.5 rounded-lg shrink-0">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <span
              className="font-bold text-slate-700 truncate max-w-[200px]"
              title={row.original.task_name}
            >
              {row.original.task_name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "task_target",
        header: "Target / Hr",
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
            {row.original.task_target || "0"}
          </span>
        ),
      },
      {
        accessorKey: "task_description",
        header: "Description",
        cell: ({ row }) => (
          <span
            className="text-slate-500 line-clamp-1 max-w-[300px]"
            title={row.original.task_description}
          >
            {row.original.task_description || "-"}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2">
            {canManageProjects && (
              <>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => openTaskModal(project, row.original)}
                  className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                  title="Edit Task"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() =>
                    handleDeleteTask(project.project_id, row.original)
                  }
                  className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                  title="Delete Task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>
        ),
      },
    ],
    [canManageProjects, openTaskModal, handleDeleteTask, project],
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-500" />
        <p className="text-sm font-medium">Fetching project tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-rose-500 bg-rose-50/50 rounded-xl border border-rose-100 px-6 mx-auto max-w-lg">
        <AlertCircle className="w-10 h-10 mb-3" />
        <p className="font-bold text-center mb-1">{error}</p>
        <p className="text-xs text-rose-400 text-center mb-4">
          You might want to check your connection or try again
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={loadTasks}
          className="font-bold border-rose-200 text-rose-600 hover:bg-rose-100 px-6"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2 py-4">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-500" /> Project Tasks
          <span className="ml-1 px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded-md font-bold">
            {tasks.length}
          </span>
        </h4>
        {canManageProjects && (
          <Button
            variant="link"
            size="sm"
            onClick={() => openTaskModal(project)}
            className="h-auto p-0 text-[10px] font-bold text-indigo-600 uppercase tracking-wider hover:underline flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add Task
          </Button>
        )}
      </div>

      <div className="animate-in fade-in duration-500">
        <DataTable
          columns={columns}
          data={tasks}
          loading={false}
          showPagination={tasks.length > 5}
          pageSize={5}
          containerClassName="rounded-xl border border-slate-100 overflow-hidden shadow-sm bg-white"
          tableClassName="text-xs"
          headerClassName="bg-slate-50/50"
          emptyIcon={Layers}
          emptyMessage="No tasks found for this project."
        />
      </div>
    </div>
  );
};

export default ProjectTasks;
