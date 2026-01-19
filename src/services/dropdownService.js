/**
 * File Name: dropdownService.js
 * Migrated from legacy frontend
 */

import api from "./api";

/**
 * Fetches data for a specific dropdown category from the backend.
 * @param {string} dropdownType - The type of data to retrieve.
 */
export const fetchDropdown = async (dropdownType) => {
  try {
    const response = await api.post("/dropdown/get", {
      dropdown_type: dropdownType,
    });

    // Returns the data array or an empty array as a fallback
    return response.data?.data || [];
  } catch (error) {
    console.error(
      `❌ Error fetching ${dropdownType}:`,
      error.response?.data || error.message
    );
    return [];
  }
};

/**
 * Executes concurrent API calls to retrieve all metadata required for user profiles.
 * Optimized with Promise.all for faster loading.
 */
export const fetchUserDropdowns = async () => {
  try {
    const [
      roles,
      designations,
      teams,
      projectManagers,
      assistantManagers,
      qas,
      agents,
    ] = await Promise.all([
      fetchDropdown("user roles"),
      fetchDropdown("designations"),
      fetchDropdown("teams"),
      fetchDropdown("project manager"),
      fetchDropdown("assistant manager"),
      fetchDropdown("qa"),
      fetchDropdown("agent"),
    ]);

    const result = {
      roles,
      designations,
      teams,
      projectManagers,
      assistantManagers,
      qas,
      agents,
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
    };
  }
};
