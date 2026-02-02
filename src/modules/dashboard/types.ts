export interface ApiEnvelope<T> {
  status: number
  data: T
  message?: string
}

export interface DateRange {
  start: string
  end: string
}

export type Id = number | string

export interface TaskRef {
  task_id?: Id
  task_name?: string
  task_target?: number | string
  label?: string
  // some endpoints / legacy payloads use `name`
  name?: string
}

export interface ProjectRef {
  project_id?: Id
  project_name?: string
  project_code?: string

  billable_hours?: number | string
  total_billable_hours?: number | string

  tasks?: TaskRef[]

  // Used in QA/PM/AM filtering
  project_manager_id?: Id
  asst_project_manager_id?: string
  project_qa_id?: string
  project_team_id?: string
}

export interface DashboardSummary {
  total_production?: number | string
  goal_progress?: number | string

  total_billable_hours?: number | string
  qc_score?: number | string
  task_count?: number | string
  project_count?: number | string

  // Used in assistant manager dashboard
  user_count?: number | string
  qc_pending?: number | string
  avg_qc_score?: number | string
  tracker_rows?: number | string
}

export interface UserRef {
  user_id?: Id
  user_name?: string
  team_name?: string
  role_id?: Id
  role_name?: string
  user_role?: string
  designation?: string
  device_id?: string
  device_type?: string
}

export interface TrackerRow {
  tracker_id?: Id
  date_time?: string
  date?: string

  user_id?: Id
  user_name?: string
  team_name?: string

  project_name?: string
  task_id?: Id
  task_name?: string

  tracker_file?: string

  billable_hours?: number | string | null
  tenure_target?: number | string | null
  production?: number | string | null
  qc_score?: number | string | null

  // backend may send extra fields
  [key: string]: unknown
}

export interface DashboardFilterData {
  summary?: DashboardSummary
  projects?: ProjectRef[]
  tasks?: TaskRef[]
  users?: UserRef[]
  tracker?: TrackerRow[]
}

export interface DashboardFilterPayload {
  logged_in_user_id: Id
  device_id: string
  device_type: string

  // different endpoints use different date keys
  date?: string
  date_from?: string
  date_to?: string
  start_date?: string
  end_date?: string

  [key: string]: unknown
}

export type TrendDir = 'up' | 'down' | 'neutral'

export interface Analytics {
  prodCurrent: number
  prodPrevious: number
  trendText: string
  trendDir: TrendDir
  monthTotal: number
  goalProgress: number
  effectiveGoal: number
  agentStats: UserRef[]
  prevRange: { label: string }
}
