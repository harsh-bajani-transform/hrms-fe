import api from "../../../services/api";
import { log, logError } from "../../../config/environment";

// Users Management

/**
 * Fetch a specific user by ID - parity with legacy userService.js
 */
export const fetchUserById = async (
  userId: string | number,
  deviceId?: string,
  deviceType?: string,
) => {
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
      const user = users.find((u: any) => String(u.user_id) === String(userId));
      if (user) {
        log("[manageService] User found:", user.user_name);
        return user;
      }
    }

    logError("[manageService] User not found with ID:", userId);
    throw new Error("User not found");
  } catch (error: any) {
    logError("[manageService] Failed to fetch user by ID:", error.message);
    throw new Error(
      error.response?.data?.message || "Failed to fetch user details",
    );
  }
};

export const fetchUsersList = async (
  userId: string | number,
  deviceId: string,
  deviceType: string,
) => {
  try {
    log("[manageService] Fetching user list for user:", userId);
    const payload = {
      user_id: userId,
      device_id: deviceId,
      device_type: deviceType,
    };
    const response = await api.post("/user/list", payload);
    return response.data;
  } catch (error: any) {
    logError("[manageService] Failed to fetch user list:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch users");
  }
};

export const addUser = async (userData: Record<string, unknown> | FormData) => {
  try {
    const isFormData = userData instanceof FormData;
    log("[manageService] Adding new user:", isFormData ? (userData as FormData).get("user_name") : (userData as any).user_name);
    
    // For auth/user, old project uses POST
    const response = await api.post("/auth/user", userData);
    return response.data;
  } catch (error: any) {
    logError("[manageService] Failed to create user:", error);
    throw new Error(error.response?.data?.message || "Failed to create user");
  }
};

export const updateUser = async (userData: Record<string, unknown> | FormData) => {
  try {
    const isFormData = userData instanceof FormData;
    log("[manageService] Updating user:", isFormData ? (userData as FormData).get("user_id") : (userData as any).user_id);
    
    const response = await api.put("/user/update_user", userData);
    return response.data;
  } catch (error: any) {
    logError("[manageService] Failed to update user:", error);
    throw new Error(error.response?.data?.message || "Failed to update user");
  }
};

export const deleteUser = async (
  userId: string | number,
  auditData: Record<string, unknown>,
) => {
  try {
    log("[manageService] Deleting user:", userId);
    const payload = { user_id: userId, ...auditData };
    const response = await api.put("/user/delete_user", payload);
    return response.data;
  } catch (error: any) {
    logError("[manageService] Failed to delete user:", error);
    throw new Error(error.response?.data?.message || "Failed to delete user");
  }
};

// Projects Management
export const fetchProjectsList = async (loggedInUserId?: string | number) => {
  try {
    const payload = loggedInUserId ? { logged_in_user_id: loggedInUserId } : {};
    const response = await api.post("/project/list", payload);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch projects",
    );
  }
};

export const createProject = async (projectData: Record<string, unknown> | FormData) => {
  try {
    const isFormData = projectData instanceof FormData;
    log("[manageService] Creating project:", isFormData ? (projectData as FormData).get("project_name") : (projectData as any).project_name);
    
    const response = await api.post("/project/create", projectData);
    return response.data;
  } catch (error: any) {
    logError("[manageService] Failed to create project:", error);
    throw new Error(
      error.response?.data?.message || "Failed to create project",
    );
  }
};

export const updateProject = async (
  projectId: string | number,
  projectData: Record<string, unknown> | FormData,
) => {
  try {
    const isFormData = projectData instanceof FormData;
    log("[manageService] Updating project:", projectId);
    
    let payload = projectData;
    if (isFormData) {
      if (!(projectData as FormData).has("project_id")) {
        (projectData as FormData).append("project_id", projectId.toString());
      }
    } else {
      payload = {
        project_id: projectId,
        ...(projectData as Record<string, unknown>),
      };
    }

    const response = await api.put("/project/update", payload);
    return response.data;
  } catch (error: any) {
    logError("[manageService] Failed to update project:", error);
    throw new Error(
      error.response?.data?.message || "Failed to update project",
    );
  }
};

export const deleteProject = async (projectId: string | number) => {
  try {
    const response = await api.put("/project/delete", {
      project_id: projectId,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to delete project",
    );
  }
};

// Task Management
export const addTask = async (taskData: Record<string, unknown>) => {
  try {
    const response = await api.post("/task/add", taskData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to add task");
  }
};

export const updateTask = async (taskData: Record<string, unknown>) => {
  try {
    const response = await api.put("/task/update", taskData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to update task");
  }
};

export const deleteTask = async (taskData: Record<string, unknown>) => {
  try {
    const response = await api.put("/task/delete", taskData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to delete task");
  }
};

// Project Category Management
export const fetchProjectCategories = async () => {
  try {
    const response = await api.post("/project_category/list", {});
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch project categories",
    );
  }
};

export const createProjectCategory = async (categoryData: {
  name: string;
  afdName: string;
}) => {
  try {
    const response = await api.post("/project_category/create", {
      project_category_name: categoryData.name,
      afd_id: categoryData.afdName,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to create project category",
    );
  }
};

export const updateProjectCategory = async (
  categoryId: string | number,
  categoryData: { name: string; afdName: string },
) => {
  try {
    const response = await api.post("/project_category/update", {
      project_category_id: categoryId,
      project_category_name: categoryData.name,
      afd_id: categoryData.afdName,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to update project category",
    );
  }
};

export const deleteProjectCategory = async (categoryId: string | number) => {
  try {
    const response = await api.put("/project_category/delete", {
      category_id: categoryId,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to delete project category",
    );
  }
};

// AFD Management
export const fetchAFDRecords = async () => {
  try {
    const response = await api.post("/qc_afd/list", {});
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch AFD records",
    );
  }
};

export const createAFDRecord = async (afdData: Record<string, unknown>) => {
  try {
    const response = await api.post("/qc_afd/add", afdData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to create AFD");
  }
};

export const updateAFDRecord = async (
  afdId: string | number,
  afdData: Record<string, unknown>,
) => {
  try {
    const response = await api.post("/qc_afd/update", {
      qc_afd_id: afdId,
      ...afdData,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to update AFD");
  }
};

export const deleteAFDRecord = async (afdId: string | number) => {
  try {
    const response = await api.post("/qc_afd/delete", {
      qc_afd_id: afdId,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to delete AFD");
  }
};
