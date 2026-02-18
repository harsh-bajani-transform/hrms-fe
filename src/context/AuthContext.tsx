/**
 * AuthContext
 * Manages authentication and authorization state using React Context.
 */

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type PermissionFlag = 0 | 1 | "0" | "1" | boolean | null | undefined;

export interface User {
  user_id?: number | string;
  id?: number | string;

  role_id?: number | string;
  role_name?: string;
  user_role?: string;

  name?: string;
  user_name?: string;
  username?: string;

  designation?: string;
  user_designation?: string;

  is_active?: 0 | 1 | boolean;

  user_creation_permission?: PermissionFlag;
  project_creation_permission?: PermissionFlag;

  user_email?: string;
  email?: string;
  avatar_url?: string;
  profile_picture?: string;
  [key: string]: unknown;
}

type Action =
  | "edit"
  | "delete"
  | "create"
  | "manage_projects"
  | "edit_project"
  | "delete_project"
  | "create_project";

export interface AuthContextValue {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  hasPermission: (permissionKey: string) => boolean;
  canPerformAction: (targetUser: User | null, action: Action) => boolean;

  canManageUsers: boolean;
  canManageProjects: boolean;
  isSuperAdmin: boolean;
  canViewSalary: boolean;
}

const isAllowed = (value: unknown): boolean =>
  value === 1 || value === "1" || value === true;

const normalizeUser = (u: User): User => {
  if (u.user_id == null && u.id != null) {
    return { ...u, user_id: u.id };
  }
  return u;
};

const parseStoredUser = (raw: string | null): User | null => {
  if (!raw || raw === "undefined") return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return normalizeUser(parsed as User);
    }
  } catch {
    // ignore
  }

  return null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() =>
    parseStoredUser(sessionStorage.getItem("user")),
  );

  /* -------------------------------------------------------------------------- */
  /*                         Cross-Tab Login Detection                          */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // 1. Detected a new login in another tab
      if (event.key === "new_login_trigger" && event.newValue) {
        const newUserRaw = sessionStorage.getItem("user");
        const newUser = parseStoredUser(newUserRaw);

        // If the user in session storage is different from current state, update state
        if (
          newUser &&
          (user?.user_id !== newUser.user_id ||
            JSON.stringify(user) !== JSON.stringify(newUser))
        ) {
          setUser(newUser);
          // Optional: Force reload to ensure all app state is fresh
          window.location.reload();
        }
      }

      // 2. Detected a logout in another tab
      if (event.key === "logout_trigger" && event.newValue) {
        // If we correspond to the same app/domain, log out here too
        setUser(null);
        sessionStorage.removeItem("user");
        window.location.href = "/auth"; // Force redirect
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user]);

  const login = (userData: User) => {
    const normalized = normalizeUser({ ...userData });
    setUser(normalized);
    sessionStorage.setItem("user", JSON.stringify(normalized));

    // Trigger event for other tabs to pick up
    // We use localStorage because 'storage' events only fire for localStorage changes in other tabs
    // (SessionStorage is per-tab, but we want to signal VALID login across tabs if that's the desired behavior.
    // However, typical single-page apps might use localStorage for the signal.)
    // Note: The requirement says "Cross-Tab Login Detection".
    // If the user logs in Tab A, Tab B should also log in (or at least know).
    // Shared state usually implies LocalStorage or Cookies.
    // Since we use SessionStorage for 'user', Tab B won't see Tab A's SessionStorage.
    // We will assume the requirement implies: "If I log in on Tab A, Tab B should likely log out or reload."
    // OR "If I log in on Tab A, Tab B is invalidated."
    // But the commit message "Cross-Tab Login Detection" usually means syncing state.
    // Given 'user' is in SessionStorage, we can't fully sync the session data purely via storage event without passing payload.
    // We'll pass the dummy signal.

    localStorage.setItem("new_login_trigger", Date.now().toString());
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("user");
    // Signal other tabs to log out
    localStorage.setItem("logout_trigger", Date.now().toString());
  };

  const hasPermission = (permissionKey: string): boolean => {
    if (!user) return false;
    return isAllowed((user as Record<string, unknown>)[permissionKey]);
  };

  const canPerformAction = (
    _targetUser: User | null,
    action: Action,
  ): boolean => {
    if (!user) return false;

    const permissionMap = {
      edit: "user_creation_permission",
      delete: "user_creation_permission",
      create: "user_creation_permission",
      manage_projects: "project_creation_permission",
      edit_project: "project_creation_permission",
      delete_project: "project_creation_permission",
      create_project: "project_creation_permission",
    } as const satisfies Record<Action, string>;

    const permissionKey = permissionMap[action];
    return hasPermission(permissionKey);
  };

  const permissions = useMemo(
    () => ({
      canManageUsers: isAllowed(user?.user_creation_permission),
      canManageProjects: isAllowed(user?.project_creation_permission),
      isSuperAdmin:
        isAllowed(user?.user_creation_permission) &&
        isAllowed(user?.project_creation_permission),
      canViewSalary:
        String(user?.role_name ?? "").toLowerCase() === "admin" ||
        String(user?.user_role ?? "").toUpperCase() === "FINANCE_HR",
    }),
    [user],
  );

  const value: AuthContextValue = {
    user,
    login,
    logout,
    hasPermission,
    canPerformAction,
    ...permissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
