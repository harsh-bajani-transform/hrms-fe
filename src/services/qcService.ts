import { qcApi } from "./api";
import api from "./api";
import { UserRef, ProjectRef } from "../modules/dashboard/types";

// ─── Response Types ─────────────────────────────────────────────

export interface QCResponse<T = unknown> {
  success: boolean;
  status: number;
  data: T;
  message?: string;
}

// ─── AFD Types (from Python /qc_afd/list) ───────────────────────

export interface RawAFDSubcategory {
  qc_afd_id: number;
  afd_name: string;
  afd_points: number;
}

export interface RawAFDCategory {
  qc_afd_id: number;
  afd_name: string;
  afd_points: number;
  subcategories: RawAFDSubcategory[];
}

export interface RawAFDMaster {
  afd_id: number;
  afd_name: string;
  categories: RawAFDCategory[];
}

// ─── Sample Types (from Node /qc-records/generate-sample) ───────

export interface SampleResponseData {
  total_records: number;
  sample_size: number;
  sample_data: Record<string, unknown>[];
}

// ─── Save Payload ───────────────────────────────────────────────

export interface SaveQCRecordPayload {
  logged_in_user_id: number | string;
  tracker_id: number | string;
  assistant_manager_id: number | string | null;
  qc_user_id: number | string;
  agent_user_id: number | string;
  project_id: number | string;
  task_id: number | string;
  file_path: string;
  date_of_file_submission: string;
  date_of_reporting: string;
  qc_score: number;
  status: string;
  file_record_count: number;
  data_generated_count: number;
  sampling_percentage: number;
  qc_file_records: Record<string, unknown>[];
  error_score: number;
  error_list: QCErrorListItem[];
  comments: string;
}

export interface QCErrorListItem {
  row: number;
  category: string;
  subcategory: string;
  error: string;
  points: number;
}

// ─── API Functions ──────────────────────────────────────────────

export const generateQCSample = async (
  tracker_id: number | string,
  logged_in_user_id: number | string,
  sampling_percentage: number = 10,
): Promise<QCResponse<SampleResponseData>> => {
  try {
    const response = await qcApi.post("/qc-records/generate-sample", {
      tracker_id,
      logged_in_user_id,
      sampling_percentage,
    });
    return response.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating sample:", message);
    throw error;
  }
};

export const saveQCRecord = async (
  payload: SaveQCRecordPayload,
): Promise<QCResponse<{ id: number }>> => {
  try {
    const response = await qcApi.post("/qc-records/save", payload);
    return response.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error saving QC record:", message);
    throw error;
  }
};

export const fetchAFDList = async (): Promise<
  QCResponse<RawAFDMaster[]>
> => {
  try {
    // AFD list is on the Python backend
    const response = await api.post("/qc_afd/list", {});
    return response.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching AFD list:", message);
    throw error;
  }
};

export const getQCRecordsList = async (
  logged_in_user_id: number | string | null = null,
): Promise<QCResponse<Record<string, unknown>[]>> => {
  try {
    const url = logged_in_user_id
      ? `/qc-records/list?logged_in_user_id=${logged_in_user_id}`
      : "/qc-records/list";
    const response = await qcApi.get(url);
    return response.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching QC records:", message);
    throw error;
  }
};

export const addTracker = async (
  formData: FormData,
): Promise<QCResponse<{ tracker_id: number }>> => {
  try {
    // tracker/add is on the Python backend (api)
    // api in api.ts handles FormData automatically (removes Content-Type for boundary)
    const response = await api.post("/tracker/add", formData);
    return response.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error adding tracker:", message);
    throw error;
  }
};

export const getUsersList = async (payload: {
  user_id: string;
  device_id: string;
  device_type: string;
}): Promise<QCResponse<UserRef[]>> => {
  try {
    const response = await api.post("/user/list", payload);
    return response.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching users list:", message);
    throw error;
  }
};
