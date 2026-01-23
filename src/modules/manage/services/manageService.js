import api from "../../../services/api";
import { log, logError } from "../../../config/environment";

// Users Management

/**
 * Fetch a specific user by ID - parity with legacy userService.js
 */
export const fetchUserById = async (userId, deviceId, deviceType) => {
  try {
    log("[manageService] Fetching user by ID:", userId);

    // Fallback to sessionStorage for device_id/device_type if not provided
    let _deviceId = deviceId;
    let _deviceType = deviceType;
    if (!_deviceId || !_deviceType) {
      try {
        const user = JSON.parse(sessionStorage.getItem("user") || "{}");
        _deviceId = _deviceId || user.device_id || "web";
        _deviceType = _deviceType || user.device_type || "Laptop";
      } catch {
        _deviceId = "web";
        _deviceType = "Laptop";
      }
    }

    // Get the current logged-in user's ID
    const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
    const currentUserId = currentUser.user_id || currentUser.id;

    const res = await api.post("/user/list", {
      user_id: String(currentUserId),
      device_id: _deviceId,
      device_type: _deviceType,
    });

    if (res.data && res.status === 200) {
      const users = res.data.data || res.data || [];
      const user = users.find((u) => String(u.user_id) === String(userId));
      if (user) {
        log("[manageService] User found:", user.user_name);
        return user;
      }
    }

    logError("[manageService] User not found with ID:", userId);
    throw new Error("User not found");
  } catch (error) {
    logError("[manageService] Failed to fetch user by ID:", error.message);
    throw new Error(
      error.response?.data?.message || "Failed to fetch user details",
    );
  }
};

export const fetchUsersList = async (userId, deviceId, deviceType) => {
  try {
    log("[manageService] Fetching user list for user:", userId);
    const payload = {
      user_id: userId,
      device_id: deviceId,
      device_type: deviceType,
    };
    const response = await api.post("/user/list", payload);
    return response.data;
  } catch (error) {
    logError("[manageService] Failed to fetch user list:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch users");
  }
};

export const addUser = async (userData) => {
  try {
    log("[manageService] Adding new user:", userData.user_name);
    const response = await api.post("/auth/user", userData);
    return response.data;
  } catch (error) {
    logError("[manageService] Failed to create user:", error);
    throw new Error(error.response?.data?.message || "Failed to create user");
  }
};

export const updateUser = async (userData) => {
  try {
    log("[manageService] Updating user:", userData.user_id);
    const response = await api.put("/user/update_user", userData);
    return response.data;
  } catch (error) {
    logError("[manageService] Failed to update user:", error);
    throw new Error(error.response?.data?.message || "Failed to update user");
  }
};

export const deleteUser = async (userId, auditData) => {
  try {
    log("[manageService] Deleting user:", userId);
    const payload = { user_id: userId, ...auditData };
    const response = await api.put("/user/delete_user", payload);
    return response.data;
  } catch (error) {
    logError("[manageService] Failed to delete user:", error);
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
      error.response?.data?.message || "Failed to fetch projects",
    );
  }
};

export const createProject = async (projectData) => {
  try {
    const response = await api.post("/project/create", projectData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to create project",
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
      error.response?.data?.message || "Failed to update project",
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
      error.response?.data?.message || "Failed to delete project",
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
