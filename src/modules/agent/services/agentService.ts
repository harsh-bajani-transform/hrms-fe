import api, { qcApi } from "../../../services/api";
import type { ApiEnvelope, ProjectRef, TaskRef } from "../../dashboard/types";

export const fetchDropdowns = async (payload: Record<string, unknown>) => {
  const res = await api.post("/dropdown/get", payload);
  return res.data;
};

/**
 * Fetch projects with tasks assigned to the logged-in agent
 * @param userId - The logged-in user's ID
 * @returns Projects with nested tasks
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
  return res; // Changed to return the full response object to match existing logic checking res.data.status
};

export const fetchTrackers = async (payload: Record<string, unknown>) => {
  const res = await api.post("/tracker/view", payload);
  return res; // Returning full response to match existing logic
};

export const deleteTracker = async (payload: Record<string, unknown>) => {
  const res = await api.post("/tracker/delete", payload);
  return res.data;
};

/**
 * AI Evaluation for tracker file
 */
export const aiEvaluate = async (formData: FormData) => {
  const res = await qcApi.post("/ai/evaluate", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 180000, // 3 minutes
  });
  return res.data;
};

/**
 * AI Duplicate check for tracker file
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
