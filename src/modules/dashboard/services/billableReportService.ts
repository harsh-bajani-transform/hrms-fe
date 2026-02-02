import api from "../../../services/api";

/**
 * Helper to get user ID from sessionStorage - matches legacy parity
 */
function getLoggedInUserId() {
  try {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    return user.user_id || user.id;
  } catch {
    return null;
  }
}

export const fetchDailyBillableReport = async (payload = {}) => {
  const user_id = getLoggedInUserId();
  const reqBody = { logged_in_user_id: user_id, ...payload };
  const res = await api.post("/tracker/view", reqBody);
  return res.data;
};

export const fetchMonthlyBillableReport = async (payload = {}) => {
  const user_id = getLoggedInUserId();
  const reqBody = { logged_in_user_id: user_id, ...payload };
  const res = await api.post("/user_monthly_tracker/list", reqBody);
  return res.data;
};
