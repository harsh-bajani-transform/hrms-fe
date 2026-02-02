import api from "./api";

export const fetchDropdownOptions = async (dropdownType, projectId = null) => {
  const payload = { dropdown_type: dropdownType };
  if (projectId) payload.project_id = projectId;
  const response = await api.post("/dropdown/get", payload);
  return response.data;
};
