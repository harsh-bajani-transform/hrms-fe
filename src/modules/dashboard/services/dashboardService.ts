import api from '../../../services/api'
import type {
  ApiEnvelope,
  DashboardFilterData,
  DashboardFilterPayload,
} from '../types'

/**
 * Fetch dashboard analytics data (summary, projects, tasks, users)
 * Endpoint: /dashboard/filter
 */
export const fetchDashboardData = async (
  payload: DashboardFilterPayload,
): Promise<ApiEnvelope<DashboardFilterData>> => {
  const response = await api.post<ApiEnvelope<DashboardFilterData>>(
    '/dashboard/filter',
    payload,
  )
  return response.data
}

/**
 * Fetch dropdown data (projects with tasks, etc.)
 * Endpoint: /dropdown/get
 */
export const fetchDropdownData = async (
  payload: Record<string, unknown>,
): Promise<ApiEnvelope<unknown>> => {
  const response = await api.post<ApiEnvelope<unknown>>('/dropdown/get', payload)
  return response.data
}
