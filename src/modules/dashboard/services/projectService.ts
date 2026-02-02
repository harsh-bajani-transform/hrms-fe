import api from '../../../services/api'
import type { ApiEnvelope, ProjectRef } from '../types'

export interface ProjectTasksPayload {
  project_id: number
}

export const fetchProjectTasks = async (
  projectId: number,
): Promise<ApiEnvelope<unknown>> => {
  const res = await api.post<ApiEnvelope<unknown>>('/task/list', {
    project_id: projectId,
  } satisfies ProjectTasksPayload)
  return res.data
}

export const fetchProjectsList = async (): Promise<ApiEnvelope<ProjectRef[]>> => {
  const res = await api.post<ApiEnvelope<ProjectRef[]>>('/project/list', {})
  return res.data
}
