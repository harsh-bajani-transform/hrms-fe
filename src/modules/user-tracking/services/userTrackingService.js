import api from "../../../services/api";

/**
 * Fetch user list with permissions
 * @param {number} user_id - Logged in user ID
 * @returns {Promise<Object>} API response with user list
 */
export const fetchUserList = async (user_id) => {
  const response = await api.post("/permission/user_list", { user_id });
  return response.data;
};

/**
 * Update user permissions
 * @param {Object} payload - Permission update data
 * @returns {Promise<Object>} API response
 */
export const updatePermission = async (payload) => {
  const response = await api.post("/permission/update", payload);
  return response.data;
};
