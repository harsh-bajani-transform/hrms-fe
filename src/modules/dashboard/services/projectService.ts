import api from "../../../services/api";

/**
 * Fetch project tasks API
 * @param {number} projectId
 */
export const fetchProjectTasks = async (projectId) => {
  const res = await api.post("/task/list", { project_id: projectId });
  return res.data;
};

/**
 * Fetch Projects List API
 * @returns {Promise} Project list response
 */
export const fetchProjectsList = async () => {
  const res = await api.post("/project/list", {});
  return res.data;
};

// Add other project services as needed for subsequent features
