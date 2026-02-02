import api from "../../../services/api";
import { log, logError } from "../../../config/environment";

export const loginUser = async (username, password, deviceId, deviceType) => {
  try {
    const payload = {
      user_email: username,
      user_password: password,
      device_id: deviceId,
      device_type: deviceType,
    };
    log("[authService] Attempting login for:", username);

    const response = await api.post("/auth/user", payload);
    log("[authService] Login successful");
    return response;
  } catch (error) {
    logError(
      "[authService] Login failed:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.message ||
        "Login failed. Please check your credentials."
    );
  }
};
