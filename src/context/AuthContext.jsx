/**
 * File: AuthContext.jsx
 * Description:
 * This file manages authentication and authorization state
 * across the application using React Context API.
 * 
 * It:
 * - Stores logged-in user data in sessionStorage
 * - Provides login and logout functionality
 * - Exposes role-based and permission-based helpers
 * - Makes auth data available to all components
 */

import { createContext, useState, useContext, useMemo } from "react";

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {

  // Initialize user state from sessionStorage and normalize user_id
  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      try {
        const parsed = JSON.parse(storedUser);
        // Normalize: always have user_id
        if (parsed && !parsed.user_id && parsed.id) {
          parsed.user_id = parsed.id;
        }
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Login: save user data in state and sessionStorage, normalize user_id
  const login = (userData) => {
    let normalized = { ...userData };
    if (!normalized.user_id && normalized.id) {
      normalized.user_id = normalized.id;
    }
    setUser(normalized);
    sessionStorage.setItem("user", JSON.stringify(normalized));
  };

  // Logout: clear user state and sessionStorage
  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("user");
  };

  // Generic permission checker (1 = allowed, 0 = denied)
  const hasPermission = (permissionKey) => {
    if (!user) return false;
    return user[permissionKey] === 1;
  };

  // Check if user can perform action (PURE permission-based - NO role restrictions)
  const canPerformAction = (targetUser, action) => {
    if (!user) return false;
    
    // Check permission flags based on action type
    const permissionMap = {
      edit: "user_creation_permission",
      delete: "user_creation_permission",
      create: "user_creation_permission",
      manage_projects: "project_creation_permission",
      edit_project: "project_creation_permission",
      delete_project: "project_creation_permission",
      create_project: "project_creation_permission",
    };

    const permissionKey = permissionMap[action];
    if (!permissionKey) return false;

    // PURE PERMISSION-BASED: If user has the permission flag, they can do the action
    return user[permissionKey] === 1 || user[permissionKey] === "1";
  };

  // Derived permissions based on permission flags from login response
  const permissions = useMemo(() => {
    if (!user) return {};

    return {
      // Can create/manage users - based on user_creation_permission flag
      canManageUsers:
        user.user_creation_permission === 1 ||
        user.user_creation_permission === "1",

      // Can create/manage projects - based on project_creation_permission flag
      canManageProjects:
        user.project_creation_permission === 1 ||
        user.project_creation_permission === "1",

      // Super Admin check - if user has both permissions, they're essentially a super admin
      isSuperAdmin:
        (user.user_creation_permission === 1 || user.user_creation_permission === "1") &&
        (user.project_creation_permission === 1 || user.project_creation_permission === "1"),

      // Can view salary details
      canViewSalary:
        String(user.role_name || "").toLowerCase() === "admin" ||
        String(user.user_role || "").toUpperCase() === "FINANCE_HR",
    };
  }, [user]);

  // Provide auth data and helpers to entire app
  return (
    <AuthContext.Provider
      value={{
        user,          // Logged-in user object
        login,         // Login function
        logout,        // Logout function
        ...permissions,// Derived permission flags
        hasPermission, // Generic permission checker
        canPerformAction, // Column-wise action permission checker
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use Auth Context
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
