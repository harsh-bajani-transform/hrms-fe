import api from "../../../services/api";

/**
 * Add a new tracker entry
 * @param {Object} payload - Tracker entry data
 * @returns {Promise<Object>} API response
 */
export const addTrackerEntry = async (payload) => {
  const response = await api.post("/tracker/add", payload);
  return response.data;
};

/**
 * Delete a tracker entry
 * @param {number} tracker_id - ID of tracker to delete
 * @returns {Promise<Object>} API response
 */
export const deleteTrackerEntry = async (tracker_id) => {
  const response = await api.post("/tracker/delete", { tracker_id });
  return response.data;
};

/**
 * Fetch tracker entries with filters
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Object>} API response with tracker data
 */
export const fetchTrackers = async (filters) => {
  const response = await api.post("/dashboard/filter", filters);
  return response.data;
};
