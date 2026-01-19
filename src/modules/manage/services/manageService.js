import api from "../../../services/api";

// Users Management
export const fetchUsersList = async (userId, deviceId, deviceType) => {
  try {
    const payload = {
      user_id: userId,
      device_id: deviceId,
      device_type: deviceType,
    };
    const response = await api.post("/user/list", payload);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch users");
  }
};

export const addUser = async (userData) => {
  try {
    const response = await api.post("/auth/user", userData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to create user");
  }
};

export const updateUser = async (userData) => {
  try {
    const response = await api.put("/user/update_user", userData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to update user");
  }
};

export const deleteUser = async (userId, auditData) => {
  try {
    const payload = { user_id: userId, ...auditData };
    const response = await api.put("/user/delete_user", payload);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to delete user");
  }
};

// Projects Management
export const fetchProjectsList = async () => {
  try {
    const response = await api.post("/project/list", {});
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch projects"
    );
  }
};

export const createProject = async (projectData) => {
  try {
    const response = await api.post("/project/create", projectData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to create project"
    );
  }
};

export const updateProject = async (projectId, projectData) => {
  try {
    const response = await api.put("/project/update", {
      project_id: projectId,
      ...projectData,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to update project"
    );
  }
};

export const deleteProject = async (projectId) => {
  try {
    const response = await api.put("/project/delete", {
      project_id: projectId,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to delete project"
    );
  }
};

// Task Management
export const addTask = async (taskData) => {
  try {
    const response = await api.post("/task/add", taskData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to add task");
  }
};

export const updateTask = async (taskData) => {
  try {
    const response = await api.put("/task/update", taskData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to update task");
  }
};

export const deleteTask = async (taskData) => {
  try {
    const response = await api.put("/task/delete", taskData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to delete task");
  }
};
