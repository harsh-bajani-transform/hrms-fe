import React, { useState, useEffect, useMemo } from "react";
import mammoth from "mammoth";
import {
  Accordion,
} from "@/components/ui/accordion";
import { Task, Project } from "../../types";
import { ProjectAccordionItem } from "./ProjectAccordionItem";
import { createTaskColumns } from "./ProjectAccordionItemColumns";
import { fetchAgentProjects } from "../../services/agentService";
import { useAuth } from "@/context/AuthContext";
import type { ProjectRef, TaskRef } from "../../../dashboard/types";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";


const getTodayString = () => {
  const today = new Date();
  return today.toISOString().slice(0, 10);
};

/**
 * Transform database project format to UI format
 */
const transformProject = (dbProject: ProjectRef): Project => {
  console.log('[transformProject] Input:', dbProject);
  const transformed = {
    id: Number(dbProject.project_id ?? 0),
    name: dbProject.project_name ?? "Unnamed Project",
    pprtFile: dbProject.project_file ?? null,
    instructionFile: null, // Can be added if backend provides this field
    tasks: (dbProject.tasks ?? []).map((task: TaskRef, index: number) => ({
      id: Number(task.task_id ?? index),
      name: task.task_name || task.label || task.name || "Unnamed Task",
      target: Number(task.task_target ?? 0),
      status: "Assigned" as const, // Default status, can be updated if backend provides
      due: getTodayString(), // Default to today, can be updated if backend provides due_date
      priority: "Medium" as const, // Default priority, can be updated if backend provides
    })),
  };
  console.log('[transformProject] Output:', transformed);
  return transformed;
};

const AgentProjectList: React.FC = () => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [dateFilter] = useState<string>(getTodayString());
  const [projects, setProjects] = useState<Project[]>([]);
  const [docxHtml, setDocxHtml] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects from database
  useEffect(() => {
    const loadProjects = async () => {
      if (!user?.user_id) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await fetchAgentProjects(user.user_id);
        
        console.log('[AgentProjectList] Full API Response:', response);
        console.log('[AgentProjectList] Response status:', response.status);
        console.log('[AgentProjectList] Response data:', response.data);
        console.log('[AgentProjectList] Is Array?', Array.isArray(response.data));
        
        if (response.status === 200 && Array.isArray(response.data)) {
          console.log('[AgentProjectList] Transforming', response.data.length, 'projects');
          const transformedProjects = response.data.map(transformProject);
          console.log('[AgentProjectList] Transformed projects:', transformedProjects);
          setProjects(transformedProjects);
        } else {
          console.warn('[AgentProjectList] No projects found or invalid response');
          setError("No projects found");
          setProjects([]);
        }
      } catch (err) {
        console.error("Error fetching agent projects:", err);
        setError(err instanceof Error ? err.message : "Failed to load projects");
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [user?.user_id]);

  // Task table columns
  const taskColumns = useMemo(() => createTaskColumns(), []);

  // Sort projects by latest assigned task (by due date, descending)
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const getLatestDue = (taskList: Task[]) => {
        if (!taskList || taskList.length === 0) return null;
        // Sort tasks by due date descending
        const sorted = [...taskList].sort((t1, t2) => {
          return new Date(t2.due).getTime() - new Date(t1.due).getTime();
        });
        return sorted[0] ? new Date(sorted[0].due).getTime() : null;
      };

      const aDue = getLatestDue(a.tasks);
      const bDue = getLatestDue(b.tasks);

      if (aDue === null && bDue === null) return 0;
      if (aDue === null) return 1;
      if (bDue === null) return -1;
      return bDue - aDue;
    });
  }, [projects]);

  // Add dummy task for today
  const handleAddDummyTask = (projectId: number) => {
    setProjects((prev: Project[]) =>
      prev.map((proj: Project) =>
        proj.id === projectId
          ? {
              ...proj,
              tasks: [
                ...proj.tasks,
                {
                  id: Date.now(),
                  name: `Dummy Task ${proj.tasks.length + 1}`,
                  target: 4,
                  status: "Assigned",
                  due: dateFilter,
                  priority: "Medium",
                },
              ],
            }
          : proj,
      ),
    );
  };

  // Fetch and convert docx to HTML when expanded
  useEffect(() => {
    if (!expanded) return;

    const project = projects.find((p: Project) => p.id === expanded);
    // If no project, or no instruction file, or already loaded, skip
    if (!project || !project.instructionFile || docxHtml[expanded]) return;

    fetch(project.instructionFile)
      .then((res) => res.arrayBuffer())
      .then((arrayBuffer) => mammoth.convertToHtml({ arrayBuffer }))
      .then((result: { value: string }) => {
        console.log("[Mammoth HTML Output]", result.value);
        setDocxHtml((prev: Record<number, string>) => ({
          ...prev,
          [expanded]: result.value,
        }));
      })
      .catch((error: unknown) => {
        console.error("Failed to load or convert docx:", error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, projects]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-4">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-4">
        <ErrorMessage message={error} />
      </div>
    );
  }

  console.log('[AgentProjectList RENDER] expanded:', expanded, 'projects count:', projects.length);

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
          Project Overview
        </h2>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Review your assigned projects, instructions, and track daily tasks.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 text-lg">No projects assigned yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
        <Accordion
          type="single"
          collapsible
          className="w-full space-y-4"
          value={expanded !== null ? String(expanded) : ""}
          onValueChange={(val: string) => {
            console.log('[Accordion] Value changed:', val);
            setExpanded(val ? Number(val) : null);
          }}
        >
          {sortedProjects.map((project: Project) => (
            <ProjectAccordionItem
              key={project.id}
              project={project}
              dateFilter={dateFilter}
              expanded={expanded}
              docxHtml={docxHtml}
              taskColumns={taskColumns}
              onAddDummyTask={handleAddDummyTask}
            />
          ))}
        </Accordion>
        </div>
      )}
    </div>
  );
};

export default AgentProjectList;
