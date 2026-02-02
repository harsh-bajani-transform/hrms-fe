import api from "../../../services/api";

/**
 * Add a new tracker entry
 * @param payload - Tracker entry data
 * @returns API response
 */
export const addTrackerEntry = async (payload: Record<string, unknown>) => {
  const response = await api.post("/tracker/add", payload);
  return response.data;
};

/**
 * Delete a tracker entry
 * @param tracker_id - ID of tracker to delete
 * @returns API response
 */
export const deleteTrackerEntry = async (tracker_id: number | string) => {
  const response = await api.post("/tracker/delete", { tracker_id });
  return response.data;
};

/**
 * Fetch tracker entries with filters
 * @param filters - Filter parameters
 * @returns API response with tracker data
 */
export const fetchTrackers = async (filters: Record<string, unknown>) => {
  const response = await api.post("/dashboard/filter", filters);
  return response.data;
};
