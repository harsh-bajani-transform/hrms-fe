import api from "../../../services/api";

export const fetchDropdowns = async (payload) => {
  const res = await api.post("/dropdown/get", payload);
  return res.data;
};

export const addTracker = async (payload) => {
  const res = await api.post("/tracker/add", payload);
  return res; // Changed to return the full response object to match existing logic checking res.data.status
};

export const fetchTrackers = async (payload) => {
  const res = await api.post("/tracker/view", payload);
  return res; // Returning full response to match existing logic
};

export const deleteTracker = async (payload) => {
  const res = await api.post("/tracker/delete", payload);
  return res.data;
};
