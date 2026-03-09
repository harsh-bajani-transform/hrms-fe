export type FieldName = "selectedProject" | "selectedTask" | "productionTarget";

export type FieldErrors = Partial<Record<FieldName, string>>;
export type FieldTouched = Partial<Record<FieldName, boolean>>;

export type ToggleTab = "daily" | "monthly";

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
  | "ai_evaluation"
  | "adherence"
  | "incentives";

import { LucideIcon } from "lucide-react";
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

export interface AIEvalDetail {
  location: string;
  issue: string;
  impact?: string;
  fix?: string;
  affectedRecords?: number;
}

export interface AISuggestion {
  id: string;
  row: number;
  column: string;
  severity: "high" | "medium" | "low";
  issue: string;
  suggestion: string;
}

export interface AIEvalResult {
  message: string;
  qualityScore: number;
  details: {
    totalRecords: number;
    issuesFound: number;
    [key: string]: unknown;
  };
  criticalIssues?: AIEvalDetail[];
  summary?:
    | string
    | {
        summary: string;
        suggestions?: AISuggestion[] | string[];
        criticalIssues?: AIEvalDetail[];
      };
  suggestions?: AISuggestion[] | string[];
}

export interface DuplicateRow {
  row: number;
  duplicateColumns: string[];
  duplicateValues: Record<string, unknown>;
  data: Record<string, unknown>;
}

export interface DuplicateCheckResult {
  hasDuplicates: boolean;
  duplicateCount: number;
  duplicates: DuplicateRow[];
  totalRecords: number;
  uniqueRecords: number;
}

export interface TrackerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projects: AgentProjectWithTasks[];
  isSubmissionWindowOpen: boolean;
}

export type DailyExportRow = {
  "Date-Time": string;
  "Assign Hours": string | number;
  "Worked Hours": string | number;
  "QC score": string | number;
  "Tracker Count": string | number;
  "Daily Required Hours": string | number;
};

export type MonthlyExportRow = {
  "Year & Month": string;
  "Billable Hours Delivered": string | number;
  "Monthly Goal": string | number;
  "Pending Target": string | number;
  "Avg. QC Score": string | number;
};

export interface TabDef {
  id: AgentTabId;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export interface AgentTabsNavigationProps {
  activeTab: AgentTabId;
  setActiveTab: (tab: AgentTabId) => void;
}

export interface AIEvaluationProps {
  projects: AgentProjectWithTasks[];
}

export interface TrackerTableProps {
  userId: Id | null | undefined;
  projects: AgentProjectWithTasks[];
  onAddEntry?: () => void;
  isSubmissionWindowOpen?: boolean;
  nextWindowTime?: string;
  timeRemaining?: string;
}

export interface CreateTrackerColumnsParams {
  handleDelete: (trackerId: Id | undefined) => void;
  getProjectName: (projectId: Id) => string;
  getTaskName: (taskId: Id, projectId: Id) => string;
  isToday: (dateTime: string | null | undefined) => boolean;
}
