import type { TrackerRow } from "../dashboard/types";

export interface QATaskNameMap {
  [taskId: string]: string;
}

export interface QAAgentTrackersMap {
  [userId: string]: TrackerRow[];
}

export interface QAExpandedAgentsMap {
  [userId: string]: boolean;
}

export interface AuditRecord {
  id?: string | number;
  audit_id?: string | number;
  qa_agent_name?: string;
  qa_agent_id?: string | number;
  agent_name?: string;
  project_name?: string;
  task_name?: string;
  file_name?: string;
  file_url?: string;
  qc_score?: string | number;
  average_qc_score?: string | number;
  total_qc_performed?: number;
  "10%_data_generated_count"?: number;
  file_record_count?: number;
  total_errors_found?: number;
  total_errors?: number;
  error_score?: number;
  audit_datetime?: string;
  date_time?: string;
  timestamp?: string; // Added to resolve TS errors in tabs
  errors_list?: string[];
  error_list?: string[];
  status?: string;
  qc_checked_file?: string;
  error_notes?: string;
  notes?: string;
  audit_performed?: boolean;
}

export interface GroupedQAAgent {
  qaAgentName: string;
  qaAgentId: string | number;
  records: AuditRecord[];
  totalQCs: number;
  totalErrors: number;
  avgScore: string | number;
}

export interface TrackerData {
  tracker_id: number | string;
  user_id: number | string;
  user_name: string;
  user_email?: string;
  email?: string;
  agent_id?: string | number;
  agent_user_id?: string | number;
  project_name?: string;
  project_id?: number | string;
  task_name?: string;
  task_id?: number | string;
  tracker_file?: string;
  file_path?: string;
  date_time?: string;
  tracker_date?: string;
  date?: string;
  created_at?: string;
  assistant_manager_id?: string | number;
  asst_manager_id?: string | number;
  ass_manager_id?: string | number;
  project_manager_id?: string | number;
  manager_id?: string | number;
  team_lead_id?: string | number;
  qc_percentage?: number | string;
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
  afd_id: number | string;
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
  subcategories: (string | number)[];
}

/** Shape of individual AFD items coming from the API */
export interface AFDApiItem {
  afd_id: number | string;
  afd_name: string;
  categories?: AFDApiCategory[];
}

export interface AFDApiCategory {
  qc_afd_id: number;
  afd_name: string;
  afd_points: number;
  subcategories?: AFDApiSubcategory[];
}

export interface AFDApiSubcategory {
  qc_afd_id: number;
  afd_name: string;
  afd_points: number;
}

/** Shape of each row in the sampled data */
export type SampleRecord = Record<string, unknown>;

export interface QCErrorEntry {
  row: number;
  category: string;
  subcategory: string;
  error: string;
  points: number;
}
