/**
 * Environment Configuration
 * Central configuration for all environment variables.
 */

export interface EnvironmentConfig {
  // API
  apiBaseUrl: string
  apiTimeout: number

  // App
  appName: string
  appEnv: string
  isDevelopment: boolean
  isProduction: boolean

  // Auth
  tokenKey: string
  userKey: string

  // File upload
  maxFileSize: number
  allowedFileTypes: readonly string[]

  // Device tracking
  deviceIdKey: string
  deviceType: string

  // Debugging
  debugMode: boolean
  consoleLogs: boolean
}

const parseIntEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

const parseBoolEnv = (value: string | undefined): boolean => value === 'true'

const config: EnvironmentConfig = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  apiTimeout: parseIntEnv(import.meta.env.VITE_API_TIMEOUT, 30000),

  // App Configuration
  appName: import.meta.env.VITE_APP_NAME ?? 'TFS Ops Tracker',
  appEnv: import.meta.env.VITE_APP_ENV ?? 'development',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,

  // Authentication
  tokenKey: import.meta.env.VITE_TOKEN_KEY ?? 'tfs_auth_token',
  userKey: import.meta.env.VITE_USER_KEY ?? 'tfs_user_data',

  // File Upload
  maxFileSize: parseIntEnv(import.meta.env.VITE_MAX_FILE_SIZE, 5242880), // 5MB
  allowedFileTypes:
    import.meta.env.VITE_ALLOWED_FILE_TYPES?.split(',') ?? [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/gif',
    ],

  // Device Tracking
  deviceIdKey: import.meta.env.VITE_DEVICE_ID_KEY ?? 'tfs_device_id',
  deviceType: import.meta.env.VITE_DEVICE_TYPE ?? 'Laptop',

  // Debugging
  debugMode: parseBoolEnv(import.meta.env.VITE_DEBUG_MODE),
  consoleLogs: parseBoolEnv(import.meta.env.VITE_CONSOLE_LOGS),
}

// Helper functions for conditional logging
export const log = (...args: unknown[]): void => {
  if (config.consoleLogs) {
    console.log(...args)
  }
}

export const logError = (...args: unknown[]): void => {
  if (config.consoleLogs) {
    console.error(...args)
  }
}

export const logWarn = (...args: unknown[]): void => {
  if (config.consoleLogs) {
    console.warn(...args)
  }
}

export default config
