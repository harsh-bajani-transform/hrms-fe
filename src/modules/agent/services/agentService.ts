import api, { qcApi } from "../../../services/api";
import type { ApiEnvelope, ProjectRef, TaskRef } from "../../dashboard/types";

export const fetchDropdowns = async (payload: Record<string, unknown>) => {
  const res = await api.post("/dropdown/get", payload);
  return res.data;
};

/**
 * Fetch projects with tasks assigned to the logged-in agent
 */
export const fetchAgentProjects = async (
  userId: number | string,
): Promise<ApiEnvelope<ProjectRef[]>> => {
  const res = await api.post<ApiEnvelope<ProjectRef[]>>("/dropdown/get", {
    dropdown_type: "projects with tasks",
    logged_in_user_id: userId,
  });
  return res.data;
};

export const addTracker = async (
  payload: Record<string, unknown> | FormData,
) => {
  const res = await api.post("/tracker/add", payload, {
    headers:
      payload instanceof FormData
        ? { "Content-Type": "multipart/form-data" }
        : {},
  });
  return res;
};

export const fetchTrackers = async (payload: Record<string, unknown>) => {
  const res = await api.post("/tracker/view", payload);
  return res;
};

export const deleteTracker = async (payload: Record<string, unknown>) => {
  const res = await api.post("/tracker/delete", payload);
  return res.data;
};

/**
 * AI Evaluation for tracker file.
 * @param formData - Must include `gemini_api_key` field alongside file/user_id/project_id/task_id
 */
export const aiEvaluate = async (formData: FormData) => {
  const res = await qcApi.post("/ai/evaluate", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 180000, // 3 minutes
  });
  return res.data;
};

/**
 * AI Duplicate check for tracker file.
 * @param formData - Must include `gemini_api_key` field
 */
export const aiDuplicateCheck = async (formData: FormData) => {
  const res = await qcApi.post("/ai/duplicate-check", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 180000, // 3 minutes
  });
  return res.data;
};

/**
 * Process excel file to create hashes
 */
export const processExcel = async (formData: FormData) => {
  const res = await api.post("/tracker/process-excel", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 300000, // 5 minutes
  });
  return res.data;
};

// ─── Gemini Key Management ───────────────────────────────────

/**
 * Save the user's Gemini API key to the DB (encrypted)
 */
export const saveGeminiApiKey = async (
  userId: string | number,
  apiKey: string,
) => {
  const res = await qcApi.post("/gemini-key/save", {
    user_id: userId,
    gemini_api_key: apiKey,
  });
  return res.data;
};

/**
 * Retrieve the user's Gemini API key from the DB (decrypted)
 */
export const fetchGeminiApiKey = async (userId: string | number) => {
  const res = await qcApi.post("/gemini-key/get", { user_id: userId });
  return res.data;
};

/**
 * Remove the user's Gemini API key from the DB
 */
export const deleteGeminiApiKey = async (userId: string | number) => {
  const res = await qcApi.post("/gemini-key/delete", { user_id: userId });
  return res.data;
};

/**
 * Fetch QC records for an agent (Node Backend)
 */
export const fetchQCRecords = async (agentUserId: string | number) => {
  const res = await qcApi.get("/qc-records/list", {
    params: { agent_user_id: agentUserId },
  });
  return res.data;
};

/**
 * Fetch rework trackers for an agent (Python Backend)
 */
export const fetchReworkTrackers = async (agentId: string | number) => {
  const res = await api.post("/qc_rework/view_rework_trackers", {
    agent_id: typeof agentId === "string" ? parseInt(agentId) : agentId,
  });
  return res.data;
};

/**
 * Add rework file for a tracker (Python Backend)
 */
export const addReworkFile = async (formData: FormData) => {
  const res = await api.post("/qc_rework/add_rework_file", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
