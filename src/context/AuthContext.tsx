/**
 * AuthContext
 * Manages authentication and authorization state using React Context.
 */

import {
  createContext,
  useState,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'

export type PermissionFlag = 0 | 1 | '0' | '1' | boolean | null | undefined

export interface User {
  user_id?: number | string
  id?: number | string

  role_id?: number | string
  role_name?: string
  user_role?: string

  name?: string
  user_name?: string
  username?: string

  designation?: string
  user_designation?: string

  is_active?: 0 | 1 | boolean

  user_creation_permission?: PermissionFlag
  project_creation_permission?: PermissionFlag

  // Backend can send additional fields (permission flags, etc.)
  [key: string]: unknown
}

type Action =
  | 'edit'
  | 'delete'
  | 'create'
  | 'manage_projects'
  | 'edit_project'
  | 'delete_project'
  | 'create_project'

export interface AuthContextValue {
  user: User | null
  login: (userData: User) => void
  logout: () => void
  hasPermission: (permissionKey: string) => boolean
  canPerformAction: (targetUser: User | null, action: Action) => boolean

  canManageUsers: boolean
  canManageProjects: boolean
  isSuperAdmin: boolean
  canViewSalary: boolean
}

const isAllowed = (value: unknown): boolean =>
  value === 1 || value === '1' || value === true

const normalizeUser = (u: User): User => {
  if (u.user_id == null && u.id != null) {
    return { ...u, user_id: u.id }
  }
  return u
}

const parseStoredUser = (raw: string | null): User | null => {
  if (!raw || raw === 'undefined') return null

  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      return normalizeUser(parsed as User)
    }
  } catch {
    // ignore
  }

  return null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() =>
    parseStoredUser(sessionStorage.getItem('user')),
  )

  const login = (userData: User) => {
    const normalized = normalizeUser({ ...userData })
    setUser(normalized)
    sessionStorage.setItem('user', JSON.stringify(normalized))
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem('user')
  }

  const hasPermission = (permissionKey: string): boolean => {
    if (!user) return false
    return isAllowed((user as Record<string, unknown>)[permissionKey])
  }

  const canPerformAction = (_targetUser: User | null, action: Action): boolean => {
    if (!user) return false

    const permissionMap = {
      edit: 'user_creation_permission',
      delete: 'user_creation_permission',
      create: 'user_creation_permission',
      manage_projects: 'project_creation_permission',
      edit_project: 'project_creation_permission',
      delete_project: 'project_creation_permission',
      create_project: 'project_creation_permission',
    } as const satisfies Record<Action, string>

    const permissionKey = permissionMap[action]
    return hasPermission(permissionKey)
  }

  const permissions = useMemo(
    () => ({
      canManageUsers: isAllowed(user?.user_creation_permission),
      canManageProjects: isAllowed(user?.project_creation_permission),
      isSuperAdmin:
        isAllowed(user?.user_creation_permission) &&
        isAllowed(user?.project_creation_permission),
      canViewSalary:
        String(user?.role_name ?? '').toLowerCase() === 'admin' ||
        String(user?.user_role ?? '').toUpperCase() === 'FINANCE_HR',
    }),
    [user],
  )

  const value: AuthContextValue = {
    user,
    login,
    logout,
    hasPermission,
    canPerformAction,
    ...permissions,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
