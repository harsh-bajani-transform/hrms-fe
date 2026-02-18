/**
 * File Name: dropdownService.ts
 * Migrated from legacy frontend
 */

import api from "./api";

interface DropdownPayload {
  dropdown_type: string;
  project_id?: string | number;
}

/**
 * Fetches data for a specific dropdown category from the backend.
 * @param dropdownType - The type of data to retrieve.
 * @param projectId - Optional project ID filter
 */
export const fetchDropdown = async (
  dropdownType: string,
  projectId: string | number | null = null,
): Promise<any[]> => {
  try {
    const payload: DropdownPayload = { dropdown_type: dropdownType };
    if (projectId) payload.project_id = projectId;
    const response = await api.post("/dropdown/get", payload);

    // Returns the data array or an empty array as a fallback
    return response.data?.data || [];
  } catch (error: any) {
    console.error(
      `❌ Error fetching ${dropdownType}:`,
      error.response?.data || error.message,
    );
    return [];
  }
};

interface UserDropdowns {
  roles: any[];
  designations: any[];
  teams: any[];
  projectManagers: any[];
  assistantManagers: any[];
  qas: any[];
  agents: any[];
  projectCategories: any[];
}

/**
 * Executes concurrent API calls to retrieve all metadata required for user profiles.
 * Optimized with Promise.all for faster loading.
 */
export const fetchUserDropdowns = async (): Promise<UserDropdowns> => {
  try {
    const [
      roles,
      designations,
      teams,
      projectManagers,
      assistantManagers,
      qas,
      agents,
      projectCategories,
    ] = await Promise.all([
      fetchDropdown("user roles"),
      fetchDropdown("designations"),
      fetchDropdown("teams"),
      fetchDropdown("project manager"),
      fetchDropdown("assistant manager"),
      fetchDropdown("qa"),
      fetchDropdown("agent"),
      fetchDropdown("project categories"),
    ]);

    const result: UserDropdowns = {
      roles,
      designations,
      teams,
      projectManagers,
      assistantManagers,
      qas,
      agents,
      projectCategories,
    };

    return result;
  } catch (error) {
    console.error("❌ Error fetching user dropdowns:", error);
    return {
      roles: [],
      designations: [],
      teams: [],
      projectManagers: [],
      assistantManagers: [],
      qas: [],
      agents: [],
      projectCategories: [],
    };
  }
};
