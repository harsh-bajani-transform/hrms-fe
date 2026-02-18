import axios, {
  AxiosHeaders,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import config, { log, logError } from "../config/environment";

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
      log(
        `[QC API Request] ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`,
      );
      return requestConfig;
    },
    (error: unknown) => {
      logError("[QC API Request Error]", error);
      return Promise.reject(error);
    },
  );

  instance.interceptors.response.use(
    (response) => {
      log(
        `[QC API Response] ${response.config.url} - Status: ${response.status}`,
      );
      return response;
    },
    (error: unknown) => {
      if (axios.isAxiosError(error)) {
        logError(
          "[QC API Response Error]",
          error.response?.status,
          error.message,
        );
        if (error.response?.status === 401) {
          localStorage.removeItem(config.tokenKey);
          localStorage.removeItem(config.userKey);
          sessionStorage.clear();
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    },
  );
};

applyInterceptors(api);
applyInterceptors(qcApi);

export default api;
