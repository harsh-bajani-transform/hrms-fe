import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Settings, Users, Briefcase, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../../context/AuthContext";
import UsersManagement from "../components/UsersManagement";
import ProjectsManagement from "../components/ProjectsManagement";
import UserTrackingView from "../components/UserTrackingView";
import UserMonthlyTargetCard from "../components/UserMonthlyTargetCard";
import { Button } from "@/components/ui/button";
import {
  fetchUsersList,
  fetchProjectsList,
} from "../../services/manageService";

import {
  useUserDropdowns,
  UserDropdowns,
} from "../../../../hooks/useUserDropdowns";

import type { ManageUser as User, ProjectType as Project } from "../../types";

const ManageView: React.FC = () => {
  const { user } = useAuth() as { user: User };
  const [activeTab, setActiveTab] = useState<string>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const { dropdowns, loadDropdowns } = useUserDropdowns();
  const hasFetchedUsers = useRef(false);
  const hasFetchedProjects = useRef(false);

  const canManageUsers =
    user?.permissions?.includes("manage_users") ||
    user?.role === "admin" ||
    user?.role_id === 1;
  const canManageProjects =
    user?.permissions?.includes("manage_projects") ||
    user?.role === "admin" ||
    user?.role_id === 1;
  const isAssistantManager = user?.role_id === 4;

  const hasLabel = (obj: unknown): obj is { label: string } => {
    return (
      !!obj &&
      typeof obj === "object" &&
      "label" in obj &&
      typeof (obj as { label: unknown }).label === "string"
    );
  };
  const enrichUsers = useCallback((rawUsers: User[], meta: UserDropdowns) => {
    if (!rawUsers || !meta) return rawUsers;
    return rawUsers.map((u) => {
      const role = meta.roles?.find((r) => r.role_id === u.role_id);
      const designation = meta.designations?.find(
        (d) => d.designation_id === u.designation_id,
      );
      return {
        ...u,
        role_name: hasLabel(role)
          ? role.label
          : typeof u.role_name === "string"
            ? u.role_name
            : undefined,
        designation_name: hasLabel(designation)
          ? designation.label
          : typeof u.designation_name === "string"
            ? u.designation_name
            : undefined,
        role_id: u.role_id?.toString(),
        designation_id: u.designation_id?.toString(),
        project_manager_id: (
          u.project_manager_id || u.project_manager
        )?.toString(),
        assistant_manager_id: (
          u.assistant_manager_id || u.assistant_manager
        )?.toString(),
        qa_id: (u.qa_id || u.qa)?.toString(),
        team_id: (u.team_id || u.team)?.toString(),
      };
    });
  }, []);

  const loadUsersData = useCallback(async () => {
    if (!user?.user_id) return;
    try {
      setLoadingUsers(true);
      const data = await fetchUsersList(user.user_id, "web", "Laptop");
      if (data.status === 200) {
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  }, [user?.user_id]);

  const enrichedUsers = useMemo(() => {
    return enrichUsers(users, dropdowns);
  }, [users, dropdowns, enrichUsers]);

  const loadProjectsData = useCallback(async () => {
    try {
      setLoadingProjects(true);
      const data = await fetchProjectsList();
      if (data.status === 200) {
        setProjects(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "users" && !hasFetchedUsers.current) {
      hasFetchedUsers.current = true;
      loadUsersData();
      loadDropdowns();
    } else if (activeTab === "projects" && !hasFetchedProjects.current) {
      hasFetchedProjects.current = true;
      loadProjectsData();
      loadDropdowns();
    }
  }, [activeTab, loadUsersData, loadProjectsData, loadDropdowns]);

  if (!canManageUsers && !canManageProjects && !isAssistantManager) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded shadow-sm border border-gray-200 p-12">
        <div className="p-6 bg-red-50 rounded-full mb-6">
          <Lock className="w-12 h-12 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Access Restricted
        </h2>
        <p className="text-gray-600 text-center max-w-md">
          You do not have permission to access this management area. Please
          contact your administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Settings className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Management Center</h1>
              <p className="text-gray-600 mt-1">
                Manage users, projects, and system settings
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded shadow-sm border border-gray-200 p-2">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeTab === "users" ? "default" : "ghost"}
            className={`flex items-center gap-2 px-6 h-11 rounded-lg font-medium text-sm transition-all ${
              activeTab === "users"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("users")}
          >
            <Users className="w-4 h-4" /> Users Management
          </Button>
          <Button
            variant={activeTab === "projects" ? "default" : "ghost"}
            className={`flex items-center gap-2 px-6 h-11 rounded-lg font-medium text-sm transition-all ${
              activeTab === "projects"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("projects")}
          >
            <Briefcase className="w-4 h-4" /> Projects Management
          </Button>
          <Button
            variant={activeTab === "tracking" ? "default" : "ghost"}
            className={`flex items-center gap-2 px-6 h-11 rounded-lg font-medium text-sm transition-all ${
              activeTab === "tracking"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("tracking")}
          >
            <Settings className="w-4 h-4" /> User Tracking
          </Button>
          <Button
            variant={activeTab === "monthly_target" ? "default" : "ghost"}
            className={`flex items-center gap-2 px-6 h-11 rounded-lg font-medium text-sm transition-all ${
              activeTab === "monthly_target"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("monthly_target")}
          >
            <Briefcase className="w-4 h-4" /> Monthly Target
          </Button>
        </div>
      </div>

      {activeTab === "users" && (
        <UsersManagement
          users={enrichedUsers}
          loading={loadingUsers}
          onRefresh={loadUsersData}
          dropdowns={dropdowns}
        />
      )}
      {activeTab === "projects" && (
        <ProjectsManagement
          projects={projects}
          loading={loadingProjects}
          onRefresh={loadProjectsData}
          dropdowns={dropdowns}
        />
      )}
      {activeTab === "tracking" && <UserTrackingView />}
      {activeTab === "monthly_target" && <UserMonthlyTargetCard />}
    </div>
  );
};

export default ManageView;
