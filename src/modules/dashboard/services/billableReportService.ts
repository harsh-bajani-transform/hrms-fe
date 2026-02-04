import api from "../../../services/api";
import type { ApiEnvelope, Id, TrackerRow } from "../types";

const getLoggedInUserId = (): Id | null => {
  try {
    const raw = sessionStorage.getItem("user");
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const u = parsed as Record<string, unknown>;
    const id = u.user_id ?? u.id;

    if (typeof id === "string" || typeof id === "number") return id;
    return null;
  } catch {
    return null;
  }
};

export interface DailyBillableReportData {
  trackers?: TrackerRow[];
  month_summary?: unknown;
}

export interface MonthlyBillableReportRow {
  month_year?: string;
  team_name?: string;
  user_id?: Id;
  user_name?: string;

  total_billable_hours?: number | string;
  total_billable_hours_month?: number | string;
  monthly_target?: number | string;
  monthly_goal?: number | string;
  pending_target?: number | string;
  avg_qc_score?: number | string;

  [key: string]: unknown;
}

export const fetchDailyBillableReport = async (
  payload: Record<string, unknown> = {},
): Promise<ApiEnvelope<DailyBillableReportData>> => {
  const user_id = getLoggedInUserId();
  const reqBody = { logged_in_user_id: user_id, ...payload };

  if (import.meta.env.MODE !== "production") {
    console.log("[fetchDailyBillableReport] Payload:", reqBody);
  }

  const res = await api.post<ApiEnvelope<DailyBillableReportData>>(
    "/tracker/view_daily",
    reqBody,
  );
  return res.data;
};

export const fetchMonthlyBillableReport = async (
  payload: Record<string, unknown> = {},
): Promise<ApiEnvelope<MonthlyBillableReportRow[]>> => {
  const user_id = getLoggedInUserId();
  const reqBody = { logged_in_user_id: user_id, ...payload };
  const res = await api.post<ApiEnvelope<MonthlyBillableReportRow[]>>(
    "/user_monthly_tracker/list",
    reqBody,
  );
  return res.data;
};
