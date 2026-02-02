import { useMemo } from 'react'

export interface DeviceInfo {
  device_id: string
  device_type: string
}

export function useDeviceInfo(): DeviceInfo {
  // Use sessionStorage or fallback to defaults
  const device_id = useMemo(
    () => sessionStorage.getItem('device_id') ?? 'adjisjd09734',
    [],
  )
  const device_type = useMemo(
    () => sessionStorage.getItem('device_type') ?? 'LAPTOP',
    [],
  )
  return { device_id, device_type }
}
