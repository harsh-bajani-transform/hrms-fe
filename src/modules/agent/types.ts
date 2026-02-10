export interface Task {
  id: number;
  name: string;
  target: number;
  status: "Assigned" | "In Progress" | "Completed";
  due: string;
  priority: "High" | "Medium" | "Low";
}

export interface Project {
  id: number;
  name: string;
  pprtFile: string | null;
  instructionFile: string | null;
  tasks: Task[];
}

// Database-aligned interfaces
export interface DBTask {
  task_id?: number | string;
  task_name?: string;
  task_target?: number | string;
  label?: string;
  name?: string;
  status?: string;
  due_date?: string;
  priority?: string;
}

export interface DBProject {
  project_id?: number | string;
  project_name?: string;
  project_file?: string | null;
  instruction_file?: string | null;
  tasks?: DBTask[];
}

// From AgentTabsNavigation
export type AgentTabId =
  | "overview"
  | "billable_report"
  | "projects"
  | "adherence"
  | "incentives";

// From AgentDashboardView/TrackerTable
// Using Id from dashboard/types, assuming it will be imported or we redefine/re-export it content-wise if we want total isolation.
// For now, let's stick to using 'Id' from global if possible, or simple types.
// The original files imported Id from dashboard/types.
import type { Id, TaskRef, TrackerRow } from "../dashboard/types";

export interface AgentTaskOption {
  task_id?: Id;
  task_name?: string;
  label?: string;
  task_target?: number | string;
}

export interface AgentProjectWithTasks {
  project_id?: Id;
  project_name?: string;
  tasks?: (AgentTaskOption | TaskRef)[];
}

export type AddTrackerPayload = {
  project_id: number | string;
  task_id: number | string;
  user_id: string | number | undefined; // was User['user_id']
  logged_in_user_id?: string | number | undefined;
  device_id?: string;
  device_type?: string;
  production: number;
  tenure_target: number;
  tracker_file?: string;
};

export type AgentTrackerRow = TrackerRow & {
  project_id?: Id;
  project_name?: string;
  task_id?: Id;
  task_name?: string;
};
