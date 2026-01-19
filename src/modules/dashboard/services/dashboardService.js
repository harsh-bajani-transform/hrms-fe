import api from "../../../services/api";

/**
 * Fetch dashboard analytics data (summary, projects, tasks, users)
 * Endpoint: /dashboard/filter
 * @param {Object} payload - { logged_in_user_id, device_id, device_type, start_date?, end_date? }
 */
export const fetchDashboardData = async (payload) => {
  const response = await api.post("/dashboard/filter", payload);
  // Return the inner data object
  return response.data;
};
