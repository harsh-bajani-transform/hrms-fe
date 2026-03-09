import axios, {
  AxiosHeaders,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  isAxiosError,
} from "axios";
import config, { log, logError } from "../config/environment";
import { getFriendlyErrorMessage } from "../utils/errorMessages";

const api: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.apiTimeout,
  headers: {
    "Content-Type": "application/json",
  },
});

export const qcApi: AxiosInstance = axios.create({
  baseURL: config.apiQcUrl,
  timeout: config.apiTimeout,
  headers: {
    "Content-Type": "application/json",
  },
});

// Apply same interceptors to qcApi
const applyInterceptors = (instance: AxiosInstance) => {
  instance.interceptors.request.use(
    (requestConfig: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem(config.tokenKey);
      if (token) {
        const headers = requestConfig.headers;
        if (!headers) {
          requestConfig.headers = new AxiosHeaders({
            Authorization: `Bearer ${token}`,
          });
        } else if ("set" in headers && typeof headers.set === "function") {
          headers.set("Authorization", `Bearer ${token}`);
        } else {
          (requestConfig.headers as Record<string, string>).Authorization =
            `Bearer ${token}`;
        }
      }

      // If the request data is FormData, remove Content-Type to let browser set it with boundary
      if (requestConfig.data instanceof FormData) {
        const headers = requestConfig.headers;
        if (headers && "delete" in headers && typeof headers.delete === "function") {
          headers.delete('Content-Type');
        } else if (headers) {
          delete (headers as Record<string, string>)['Content-Type'];
        }
        log('[API Request] Detected FormData, removed Content-Type header');
      }

      log(
        `[API Request] ${requestConfig.method?.toUpperCase() || 'GET'} ${requestConfig.url}`,
      );
      return requestConfig;
    },
    (error: unknown) => {
      logError("[API Request Error]", error);
      return Promise.reject(error);
    },
  );

  instance.interceptors.response.use(
    (response) => {
      log(
        `[API Response] ${response.config.url} - Status: ${response.status}`,
      );
      return response;
    },
    (error: unknown) => {
      if (isAxiosError(error)) {
        logError(
          "[API Response Error]",
          error.response?.status,
          error.message,
        );

        // Handle 401 unauthorized - token expired or invalid
        const isAuthEndpoint = error.config?.url?.includes('/auth/');
        const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/';

        if (error.response?.status === 401 && !isAuthEndpoint && !isLoginPage) {
          log("[API] 401 detected, redirecting to login");
          localStorage.removeItem(config.tokenKey);
          localStorage.removeItem(config.userKey);
          sessionStorage.clear();
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // Handle 403 forbidden - insufficient permissions
        if (error.response?.status === 403) {
          logError('[API] Access forbidden - Insufficient permissions');
        }

        // Handle 500 server errors
        if (error.response?.status && error.response.status >= 500) {
          logError('[API] Server error occurred');
        }

        // Add friendly message to the error object
        const responseData = error.response?.data;
        const errorCode = typeof responseData === 'object' && responseData !== null 
          ? (responseData as any).code || (responseData as any).message 
          : undefined;
        
        const friendlyMessage = getFriendlyErrorMessage(errorCode || error.message);
        (error as any).friendlyMessage = friendlyMessage;
      }
      return Promise.reject(error);
    },
  );
};

applyInterceptors(api);
applyInterceptors(qcApi);

export default api;
