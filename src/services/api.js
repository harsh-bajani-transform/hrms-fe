import axios from "axios";
import config, { log, logError } from "../config/environment";

const api = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.apiTimeout,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add auth token to all requests
api.interceptors.request.use(
  (requestConfig) => {
    const token = localStorage.getItem(config.tokenKey);
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }

    log(
      `[API Request] ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`
    );

    return requestConfig;
  },
  (error) => {
    logError("[API Request Error]", error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    log(`[API Response] ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error) => {
    logError("[API Response Error]", error.response?.status, error.message);

    // Handle 401 unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      localStorage.removeItem(config.tokenKey);
      localStorage.removeItem(config.userKey);
      sessionStorage.clear();
      window.location.href = "/login";
    }

    // Handle 403 forbidden - insufficient permissions
    if (error.response?.status === 403) {
      logError("[API] Access forbidden - Insufficient permissions");
    }

    // Handle 500 server errors
    if (error.response?.status >= 500) {
      logError("[API] Server error occurred");
    }

    return Promise.reject(error);
  }
);

export default api;
