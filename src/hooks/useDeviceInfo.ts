import { useMemo } from "react";

export function useDeviceInfo() {
  // Use sessionStorage or fallback to defaults
  const device_id = useMemo(
    () => sessionStorage.getItem("device_id") || "adjisjd09734",
    []
  );
  const device_type = useMemo(
    () => sessionStorage.getItem("device_type") || "LAPTOP",
    []
  );
  return { device_id, device_type };
}
