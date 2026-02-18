import axios from "axios";
import { useState, useCallback } from "react";
import { fetchUserDropdowns } from "../services/dropdownService";

export type DropdownOption = Record<string, unknown>;

export interface UserDropdowns {
  roles: DropdownOption[];
  designations: DropdownOption[];
  teams: DropdownOption[];
  projectManagers: DropdownOption[];
  assistantManagers: DropdownOption[];
  qas: DropdownOption[];
  agents: DropdownOption[];
}

const emptyDropdowns: UserDropdowns = {
  roles: [],
  designations: [],
  teams: [],
  projectManagers: [],
  assistantManagers: [],
  qas: [],
  agents: [],
};

const isUserDropdowns = (value: unknown): value is UserDropdowns => {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;

  return (
    Array.isArray(v.roles) &&
    Array.isArray(v.designations) &&
    Array.isArray(v.teams) &&
    Array.isArray(v.projectManagers) &&
    Array.isArray(v.assistantManagers) &&
    Array.isArray(v.qas) &&
    Array.isArray(v.agents)
  );
};

export const useUserDropdowns = () => {
  const [dropdowns, setDropdowns] = useState<UserDropdowns>(emptyDropdowns);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  const loadDropdowns = useCallback(async (): Promise<UserDropdowns | null> => {
    setLoading(true);
    setError(null);

    try {
      const data: unknown = await fetchUserDropdowns();

      if (!isUserDropdowns(data)) {
        console.warn("⚠️ Invalid dropdown response:", data);
        return null;
      }

      setDropdowns(data);
      return data;
    } catch (err: unknown) {
      console.error("❌ Dropdown fetch failed:", err);

      if (axios.isAxiosError(err)) {
        console.error("Error details:", err.response?.data ?? err.message);
      } else if (err instanceof Error) {
        console.error("Error details:", err.message);
      }

      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    dropdowns,
    loading,
    error,
    loadDropdowns,
  };
};
