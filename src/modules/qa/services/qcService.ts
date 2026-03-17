import api, { qcApi } from "../../../services/api";
import { log, logError } from "../../../config/environment";
import { AFDApiCategory } from "../types";

export interface TempQCPayload {
  user_id: string | number;
  date: string;
  assigned_hours?: number;
  qc_score?: number;
}

/**
 * Saves temporary QC data for an agent on a specific date.
 * Interacts with /qc/temp-qc endpoint.
 */
export const saveTempQC = async (payload: TempQCPayload) => {
  try {
    log(
      `[QC Service] Saving temp QC for user ${payload.user_id} on ${payload.date}`,
    );
    const response = await api.post("/qc/temp-qc", payload);
    return response.data;
  } catch (error) {
    logError("[QC Service] Error saving temp QC:", error);
    throw error;
  }
};

/**
 * Fetch AFD (Attribute/Feature/Defect) data for a project category
 */
export const fetchProjectCategoryAFD = async (project_category_id: number | string) => {
  try {
    log(`[QC Service] Fetching AFD for project category ${project_category_id}`);
    const response = await api.post("/project_category/list", {
      project_category_id,
    });
    return response.data;
  } catch (error) {
    logError("[QC Service] Error fetching project category AFD:", error);
    throw error;
  }
};

/**
 * Generate 10% sample data from tracker file (Node API)
 */
export const generateQCSample = async (tracker_id: number | string, logged_in_user_id: number | string) => {
  try {
    log(`[QC Service] Generating sample for tracker ${tracker_id}`);
    const response = await qcApi.post("/qc-records/generate-sample", {
      tracker_id,
      logged_in_user_id,
    });
    return response.data;
  } catch (error) {
    logError("[QC Service] Error generating QC sample:", error);
    throw error;
  }
};

/**
 * Save QC Form Record (Node API)
 */
export const saveQCRecord = async (payload: Record<string, unknown>) => {
  try {
    log(`[QC Service] Saving QC record for tracker ${payload.tracker_id}`);
    const response = await qcApi.post("/qc-records/save", payload);
    return response.data;
  } catch (error) {
    logError("[QC Service] Error saving QC record:", error);
    throw error;
  }
};

/**
 * Fetch QC Form Records (Node API)
 */
export const getQCRecordsList = async (logged_in_user_id: number | string | null = null) => {
  try {
    log(`[QC Service] Fetching QC records list`);
    const url = logged_in_user_id
      ? `/qc-records/list?logged_in_user_id=${logged_in_user_id}`
      : "/qc-records/list";
    const response = await qcApi.get(url);
    return response.data;
  } catch (error) {
    logError("[QC Service] Error fetching QC records:", error);
    throw error;
  }
};

/**
 * Add QC Audit entry (Python API)
 */
export const addQCAudit = async (formData: FormData) => {
  try {
    log("[QC Service] Adding QC Audit entry");
    const response = await api.post("/qc_audit/add", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    logError("[QC Service] Error adding QC Audit:", error);
    throw error;
  }
};

/**
 * Fetch QC Audit Report (Python API)
 */
export const getQCAuditReport = async () => {
  try {
    log("[QC Service] Fetching QC Audit report");
    const response = await api.post("/qc_audit/report");
    return response.data;
  } catch (error) {
    logError("[QC Service] Error fetching QC Audit report:", error);
    throw error;
  }
};
/**
 * Fetch all project categories (Python API)
 */
export const fetchProjectCategories = async () => {
  try {
    log("[QC Service] Fetching all project categories");
    const response = await api.get("/project_category/list_all");
    return response.data;
  } catch (error) {
    logError("[QC Service] Error fetching project categories:", error);
    throw error;
  }
};

/**
 * Update project category AFD configuration (Python API)
 */
export const updateProjectCategoryAFD = async (payload: {
  project_category_id: number | string;
  categories: AFDApiCategory[];
}) => {
  try {
    log(
      `[QC Service] Updating AFD for project category ${payload.project_category_id}`,
    );
    const response = await api.post("/project_category/update_afd", payload);
    return response.data;
  } catch (error) {
    logError("[QC Service] Error updating project category AFD:", error);
    throw error;
  }
};
