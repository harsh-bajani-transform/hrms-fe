export interface TaskType {
  task_id?: string | number;
  task_name?: string;
  task_description?: string;
  start_date?: string;
  end_date?: string;
  assigned_to?: string | number;
  project_id?: string | number;
  attachment?: string | null;
  [key: string]: unknown;
}

export interface ProjectType {
  project_id: string | number;
  project_name?: string;
  owner_name?: string;
  apm_name?: string;
  qa_name?: string;
  monthly_hours_target?: number;
  tasks?: TaskType[];
  // For compatibility with ProjectFormModal's ProjectType
  owner_id?: string | number;
  apm_id?: string | number;
  qa_id?: string | number;
  project_file?: string | null;
  [key: string]: unknown;
}

export interface ManageUser {
  user_id: string | number;
  user_name?: string;
  user_email?: string;
  role_id?: string | number;
  role?: string;
  permissions?: string[];
  designation_id?: string | number;
  designation_name?: string;
  project_manager_id?: string | number;
  assistant_manager_id?: string | number;
  qa_id?: string | number;
  team_id?: string | number;
  is_active?: number;
  [key: string]: unknown;
}
