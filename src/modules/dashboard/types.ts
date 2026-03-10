import { HourlyChartDatum } from "./ui/components/overview/HourlyChart";

export interface ApiEnvelope<T> {
  status: number;
  data: T;
  message?: string;
}

export interface DateRange {
  start: string;
  end: string;
}

export type Id = number | string;

export interface TaskRef {
  task_id?: Id;
  task_name?: string;
  task_target?: number | string;
  label?: string;
  // some endpoints / legacy payloads use `name`
  name?: string;
}

export interface ProjectRef {
  project_id?: Id;
  project_name?: string;
  project_code?: string;

  billable_hours?: number | string;
  total_billable_hours?: number | string;

  tasks?: TaskRef[];

  // Used in QA/PM/AM filtering
  project_manager_id?: Id;
  asst_project_manager_id?: string;
  project_qa_id?: string;
  project_team_id?: string;
  project_file?: string | null;
}

export interface DashboardSummary {
  total_production?: number | string;
  goal_progress?: number | string;

  total_billable_hours?: number | string;
  qc_score?: number | string;
  task_count?: number | string;
  project_count?: number | string;

  // Used in assistant manager dashboard
  user_count?: number | string;
  qc_pending?: number | string;
  avg_qc_score?: number | string;
  tracker_rows?: number | string;
}

export interface UserRef {
  user_id?: Id;
  user_name?: string;
  team_name?: string;
  role_id?: Id;
  role_name?: string;
  user_role?: string;
  designation?: string;
  device_id?: string;
  device_type?: string;
  user_tenure?: number | string;
}

export interface TrackerRow {
  tracker_id?: Id;
  date_time?: string;
  date?: string;

  user_id?: Id;
  user_name?: string;
  team_name?: string;

  project_name?: string;
  task_id?: Id;
  task_name?: string;

  tracker_file?: string;

  billable_hours?: number | string | null;
  tenure_target?: number | string | null;
  production?: number | string | null;
  qc_score?: number | string | null;

  // New fields from latest backend changes
  cumulative_billable_hours_till_day?: number | string | null;
  daily_required_hours?: number | string | null;
  trackers_count_day?: number | string | null;
  work_date?: string;

  // backend may send extra fields
  [key: string]: unknown;
}

export interface DashboardFilterData {
  summary?: DashboardSummary;
  projects?: ProjectRef[];
  tasks?: TaskRef[];
  users?: UserRef[];
  tracker?: TrackerRow[];
}

export interface DashboardFilterPayload {
  logged_in_user_id: Id;
  device_id: string;
  device_type: string;

  // different endpoints use different date keys
  date?: string;
  date_from?: string;
  date_to?: string;
  start_date?: string;
  end_date?: string;

  [key: string]: unknown;
}

export type TrendDir = "up" | "down" | "neutral";

export interface Analytics {
  prodCurrent: number;
  prodPrevious: number;
  trendText: string;
  trendDir: TrendDir;
  monthTotal: number;
  goalProgress: number;
  effectiveGoal: number;
  agentStats: UserRef[];
  prevRange: { label: string };
}

export interface OverviewTabProps {
  analytics?: Analytics;
  hourlyChartData?: HourlyChartDatum[];
  isAgent: boolean;
  isQA?: boolean;
  dateRange?: DateRange;
}

export interface QASummaryRow {
  month_year?: string;
  total_billable_hours_month?: number | string;
  pending_days?: number | string;
}

export interface QATrackerViewData {
  month_summary?: QASummaryRow[];
  trackers?: TrackerRow[];
}

export interface QAAgentDashboardProps {
  dateRange: {
    start: string;
    end: string;
  };
}

export interface TrackerFile {
  tracker_id: number | string;
  date_time?: string;
  user_name?: string;
  project_name?: string;
  task_name?: string;
  tracker_file?: string;
  task_id?: number | string;
}

export interface Stats {
  totalAgents: number;
  pendingQCFiles: number;
  placeholder1: number;
  placeholder2: number;
}

export type TaskMapValue = {
  task_name: string;
  task_target: string | number | null;
};

export interface Agent {
  user_id: number | string;
  user_name: string;
  user_tenure?: number | string;
}

export interface Task {
  task_id: number | string;
  task_name?: string;
  task_target?: number | string;
}

export interface ProjectWithTasks {
  tasks?: Task[];
}

export interface DropdownTaskMap {
  [taskId: string]: number | string;
}

export interface QCFormViewProps {
  tracker: TrackerRow;
  onBack: () => void;
  onSubmitSuccess: () => void;
}

export interface AFDSubcategory {
  qc_afd_id: number;
  name: string;
  points: number;
}

export interface AFDCategory {
  qc_afd_id: number;
  name: string;
  points: number;
  subcategories: AFDSubcategory[];
}

export interface AFDData {
  afd_id: number;
  afd_name: string;
  categories: AFDCategory[];
}

export interface ErrorSelection {
  categoryId: number;
  subcategoryId: number;
}

export interface FormRow {
  id: string | number;
  originalData: Record<string, unknown>;
  errors: ErrorSelection[];
}
export interface PendingSelection {
  category: string;
  subcategories: number[];
}
