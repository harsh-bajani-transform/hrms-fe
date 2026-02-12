import axios, { type AxiosResponse } from "axios";
import api from "../../../services/api";
import { log, logError } from "../../../config/environment";
import type { User } from "../../../context/AuthContext";

type LoginResponseBody =
  | ({ data?: User; user?: User; message?: string } & Record<string, unknown>)
  | User;

interface LoginRequest {
  user_email: string;
  user_password: string;
  device_id: string;
  device_type: string;
}

interface ForgotPasswordRequest {
  user_email: string;
  device_id: string;
  device_type: string;
}

interface VerifyResetTokenRequest {
  token: string;
  device_id: string;
  device_type: string;
}

interface ResetPasswordRequest {
  token: string;
  new_password: string;
  device_id: string;
  device_type: string;
}

const extractErrorMessage = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const msg = p.message;
  return typeof msg === "string" && msg.trim() ? msg : null;
};

export const loginUser = async (
  username: string,
  password: string,
  deviceId: string,
  deviceType: string,
): Promise<AxiosResponse<LoginResponseBody>> => {
  const payload: LoginRequest = {
    user_email: username,
    user_password: password,
    device_id: deviceId,
    device_type: deviceType,
  };

  try {
    log("[authService] Attempting login for:", username);
    const response = await api.post<LoginResponseBody>("/auth/user", payload);
    log("[authService] Login successful");
    return response;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      logError(
        "[authService] Login failed:",
        error.response?.data ?? error.message,
      );
      const msg = extractErrorMessage(error.response?.data);
      throw new Error(msg ?? "Login failed. Please check your credentials.");
    }

    logError("[authService] Login failed:", error);
    throw new Error("Login failed. Please check your credentials.");
  }
};

export const forgotPassword = async (
  email: string,
  deviceId: string,
  deviceType: string,
): Promise<AxiosResponse> => {
  const payload: ForgotPasswordRequest = {
    user_email: email,
    device_id: deviceId,
    device_type: deviceType,
  };

  try {
    log("[authService] Sending password reset link to:", email);
    const response = await api.post("/password_reset/forgot-password", payload);
    log("[authService] Password reset link sent successfully");
    return response;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      logError(
        "[authService] Forgot password failed:",
        error.response?.data ?? error.message,
      );
      const msg = extractErrorMessage(error.response?.data);
      throw new Error(msg ?? "Failed to send reset link. Please try again.");
    }

    logError("[authService] Forgot password failed:", error);
    throw new Error("Failed to send reset link. Please try again.");
  }
};

export const verifyResetToken = async (
  token: string,
  deviceId: string,
  deviceType: string,
): Promise<AxiosResponse> => {
  const payload: VerifyResetTokenRequest = {
    token,
    device_id: deviceId,
    device_type: deviceType,
  };

  try {
    log("[authService] Verifying reset token");
    const response = await api.post(
      "/password_reset/verify-reset-token",
      payload,
    );
    log("[authService] Token verified successfully");
    return response;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      logError(
        "[authService] Token verification failed:",
        error.response?.data ?? error.message,
      );
      const msg = extractErrorMessage(error.response?.data);
      throw new Error(msg ?? "Invalid or expired reset link.");
    }

    logError("[authService] Token verification failed:", error);
    throw new Error("Invalid or expired reset link.");
  }
};

export const resetPassword = async (
  token: string,
  newPassword: string,
  deviceId: string,
  deviceType: string,
): Promise<AxiosResponse> => {
  const payload: ResetPasswordRequest = {
    token,
    new_password: newPassword,
    device_id: deviceId,
    device_type: deviceType,
  };

  try {
    log("[authService] Resetting password");
    const response = await api.post("/password_reset/reset-password", payload);
    log("[authService] Password reset successful");
    return response;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      logError(
        "[authService] Password reset failed:",
        error.response?.data ?? error.message,
      );
      const msg = extractErrorMessage(error.response?.data);
      throw new Error(msg ?? "Failed to reset password. Please try again.");
    }

    logError("[authService] Password reset failed:", error);
    throw new Error("Failed to reset password. Please try again.");
  }
};
