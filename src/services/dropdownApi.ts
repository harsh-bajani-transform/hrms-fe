import api from "./api";

interface DropdownPayload {
  dropdown_type: string;
  project_id?: string | number | null;
}

export const fetchDropdownOptions = async (
  dropdownType: string,
  projectId: string | number | null = null,
) => {
  const payload: DropdownPayload = { dropdown_type: dropdownType };
  if (projectId) payload.project_id = projectId;
  const response = await api.post("/dropdown/get", payload);
  return response.data;
};
