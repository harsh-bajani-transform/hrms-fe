import axios, { type AxiosResponse } from 'axios'
import api from '../../../services/api'
import { log, logError } from '../../../config/environment'
import type { User } from '../../../context/AuthContext'

type LoginResponseBody =
  | ({ data?: User; user?: User; message?: string } & Record<string, unknown>)
  | User

interface LoginRequest {
  user_email: string
  user_password: string
  device_id: string
  device_type: string
}

const extractErrorMessage = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') return null
  const p = payload as Record<string, unknown>
  const msg = p.message
  return typeof msg === 'string' && msg.trim() ? msg : null
}

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
  }

  try {
    log('[authService] Attempting login for:', username)
    const response = await api.post<LoginResponseBody>('/auth/user', payload)
    log('[authService] Login successful')
    return response
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      logError('[authService] Login failed:', error.response?.data ?? error.message)
      const msg = extractErrorMessage(error.response?.data)
      throw new Error(msg ?? 'Login failed. Please check your credentials.')
    }

    logError('[authService] Login failed:', error)
    throw new Error('Login failed. Please check your credentials.')
  }
}
