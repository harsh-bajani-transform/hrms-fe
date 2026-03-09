import api from "./api";

/**
 * Billable Report Service
 * Migrated from legacy frontend billableReportService.js
 */

function getLoggedInUserId(): string | number | undefined {
  try {
    const raw = sessionStorage.getItem("user");
    if (!raw) return undefined;
    const user = JSON.parse(raw);
    return user?.user_id || user?.id || undefined;
  } catch {
    return undefined;
  }
}

export interface BillableReportPayload {
  logged_in_user_id?: string | number | undefined;
  [key: string]: unknown;
}

/**
 * Fetch daily billable report
 * @param payload - Optional filters
 */
export const fetchDailyBillableReport = async (
  payload: Record<string, unknown> = {},
) => {
  const user_id = getLoggedInUserId();
  const reqBody: BillableReportPayload = { logged_in_user_id: user_id, ...payload };
  
  const res = await api.post("/tracker/view_daily", reqBody);
  return res.data;
};

/**
 * Fetch monthly billable report
 * @param payload - Optional filters
 */
export const fetchMonthlyBillableReport = async (
  payload: Record<string, unknown> = {},
) => {
  const user_id = getLoggedInUserId();
  const reqBody: BillableReportPayload = { logged_in_user_id: user_id, ...payload };
  
  const res = await api.post("/user_monthly_tracker/list", reqBody);
  return res.data;
};
