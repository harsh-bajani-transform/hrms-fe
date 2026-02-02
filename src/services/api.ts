import axios, {
  AxiosHeaders,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import config, { log, logError } from '../config/environment'

const api: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token to all requests
api.interceptors.request.use(
  (requestConfig: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(config.tokenKey)

    if (token) {
      // Axios v1 headers can be an AxiosHeaders instance.
      const headers = requestConfig.headers
      if (!headers) {
        requestConfig.headers = new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        })
      } else if ('set' in headers && typeof headers.set === 'function') {
        headers.set('Authorization', `Bearer ${token}`)
      } else {
        ;(requestConfig.headers as Record<string, string>).Authorization =
          `Bearer ${token}`
      }
    }

    log(
      `[API Request] ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`,
    )

    return requestConfig
  },
  (error: unknown) => {
    logError('[API Request Error]', error)
    return Promise.reject(error)
  },
)

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => {
    log(`[API Response] ${response.config.url} - Status: ${response.status}`)
    return response
  },
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      logError('[API Response Error]', error.response?.status, error.message)

      // Handle 401 unauthorized - token expired or invalid
      if (error.response?.status === 401) {
        localStorage.removeItem(config.tokenKey)
        localStorage.removeItem(config.userKey)
        sessionStorage.clear()
        window.location.href = '/login'
      }

      // Handle 403 forbidden - insufficient permissions
      if (error.response?.status === 403) {
        logError('[API] Access forbidden - Insufficient permissions')
      }

      // Handle 500 server errors
      if ((error.response?.status ?? 0) >= 500) {
        logError('[API] Server error occurred')
      }
    } else {
      logError('[API Response Error]', error)
    }

    return Promise.reject(error)
  },
)

export default api
