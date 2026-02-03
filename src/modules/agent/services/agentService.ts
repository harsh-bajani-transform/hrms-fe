import api from "../../../services/api";
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

export const addTracker = async (payload: Record<string, unknown>) => {
  const res = await api.post("/tracker/add", payload);
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
