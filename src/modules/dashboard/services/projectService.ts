import api from "../../../services/api";
import type { ApiEnvelope, ProjectRef } from "../types";

export interface ProjectTasksPayload {
  project_id: number;
}

export const fetchProjectTasks = async (
  projectId: number,
): Promise<ApiEnvelope<unknown>> => {
  const res = await api.post<ApiEnvelope<unknown>>("/task/list", {
    project_id: projectId,
  } satisfies ProjectTasksPayload);
  return res.data;
};

export const fetchProjectsList = async (
  logged_in_user_id?: number | string,
): Promise<ApiEnvelope<ProjectRef[]>> => {
  const payload = logged_in_user_id ? { logged_in_user_id } : {};
  const res = await api.post<ApiEnvelope<ProjectRef[]>>(
    "/project/list",
    payload,
  );
  return res.data;
};

export const deleteProject = async (
  projectId: number,
): Promise<ApiEnvelope<unknown>> => {
  const res = await api.put<ApiEnvelope<unknown>>("/project/delete", {
    project_id: projectId,
  });
  return res.data;
};
