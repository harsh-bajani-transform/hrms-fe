import api from "../../../services/api";

/**
 * Fetch user list with permissions
 * @param user_id - Logged in user ID
 * @returns API response with user list
 */
export const fetchUserList = async (user_id: number | string) => {
  const response = await api.post("/permission/user_list", { user_id });
  return response.data;
};

/**
 * Update user permissions
 * @param payload - Permission update data
 * @returns API response
 */
export const updatePermission = async (payload: Record<string, unknown>) => {
  const response = await api.post("/permission/update", payload);
  return response.data;
};
