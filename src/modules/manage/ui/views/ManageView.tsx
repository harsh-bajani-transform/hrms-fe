import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  Settings,
  Users,
  Briefcase,
  Lock,
  FolderKanban,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../../context/AuthContext";
import UsersManagement from "../components/UsersManagement";
import ProjectsManagement from "../components/ProjectsManagement";
import UserTrackingView from "../components/UserTrackingView";
import UserMonthlyTargetCard from "../components/UserMonthlyTargetCard";
import ProjectCategoryManagement from "../components/ProjectCategoryManagement";
import AFDManagement from "../components/AFDManagement";
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
  const [activeTab, setActiveTab] = useState<"users" | "projects">("users");
  const [activeSubTab, setActiveSubTab] = useState<string>("");

  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const { dropdowns, loadDropdowns } = useUserDropdowns();
  const hasFetchedUsers = useRef(false);
  const hasFetchedProjects = useRef(false);

  // Set default sub-tabs when main tab changes
  useEffect(() => {
    if (activeTab === "users") setActiveSubTab("list");
    if (activeTab === "projects") setActiveSubTab("projects_list");
  }, [activeTab]);

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
            : "",
        designation_name: hasLabel(designation)
          ? designation.label
          : typeof u.designation_name === "string"
            ? u.designation_name
            : "",
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
      const data = await fetchProjectsList(user?.user_id);
      if (data.status === 200) {
        setProjects(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoadingProjects(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    if (
      activeTab === "users" &&
      activeSubTab === "list" &&
      !hasFetchedUsers.current
    ) {
      hasFetchedUsers.current = true;
      loadUsersData();
      loadDropdowns();
    } else if (
      activeTab === "projects" &&
      activeSubTab === "projects_list" &&
      !hasFetchedProjects.current
    ) {
      hasFetchedProjects.current = true;
      loadProjectsData();
      loadDropdowns();
    }
  }, [activeTab, activeSubTab, loadUsersData, loadProjectsData, loadDropdowns]);

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
              <h1 className="text-2xl font-bold tracking-tight">
                Management Center
              </h1>
              <p className="text-gray-500 text-sm mt-0.5 font-medium">
                Configure users, project workflows, targets and quality metrics.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1.5 flex gap-1.5 w-fit mx-auto sm:mx-0">
        <Button
          variant={activeTab === "users" ? "default" : "ghost"}
          className={`flex items-center gap-2 px-8 py-6 rounded-lg font-bold text-sm transition-all duration-300 ${
            activeTab === "users"
              ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
              : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
          }`}
          onClick={() => setActiveTab("users")}
        >
          <Users
            className={`w-4 h-4 ${activeTab === "users" ? "text-white" : "text-blue-500"}`}
          />
          User Management
        </Button>
        <Button
          variant={activeTab === "projects" ? "default" : "ghost"}
          className={`flex items-center gap-2 px-8 py-6 rounded-lg font-bold text-sm transition-all duration-300 ${
            activeTab === "projects"
              ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
              : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
          }`}
          onClick={() => setActiveTab("projects")}
        >
          <Briefcase
            className={`w-4 h-4 ${activeTab === "projects" ? "text-white" : "text-blue-500"}`}
          />
          Projects & Targets
        </Button>
      </div>

      {/* Sub-navigation Section */}
      <div className="space-y-4">
        {activeTab === "users" && (
          <div className="flex gap-2 border-b border-gray-200 pb-px px-2 overflow-x-auto scrollbar-hide">
            {[
              { id: "list", label: "Users List", icon: Users },
              { id: "tracking", label: "User Tracking", icon: Settings },
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() => setActiveSubTab(sub.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all relative whitespace-nowrap ${
                  activeSubTab === sub.id
                    ? "text-blue-600 bg-blue-50/50 rounded-t-lg"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50/50 rounded-t-lg"
                }`}
              >
                <sub.icon
                  className={`w-3.5 h-3.5 ${activeSubTab === sub.id ? "text-blue-600" : "text-gray-400"}`}
                />
                {sub.label}
                {activeSubTab === sub.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 animate-in fade-in slide-in-from-bottom-1" />
                )}
              </button>
            ))}
          </div>
        )}

        {activeTab === "projects" && (
          <div className="flex gap-2 border-b border-gray-200 pb-px px-2 overflow-x-auto scrollbar-hide">
            {[
              { id: "projects_list", label: "Projects List", icon: Briefcase },
              {
                id: "monthly_target",
                label: "Monthly Targets",
                icon: Briefcase,
              },
              { id: "category", label: "Project Category", icon: FolderKanban },
              { id: "afd", label: "AFD Management", icon: FileText },
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() => setActiveSubTab(sub.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all relative whitespace-nowrap ${
                  activeSubTab === sub.id
                    ? "text-blue-600 bg-blue-50/50 rounded-t-lg"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50/50 rounded-t-lg"
                }`}
              >
                <sub.icon
                  className={`w-3.5 h-3.5 ${activeSubTab === sub.id ? "text-blue-600" : "text-gray-400"}`}
                />
                {sub.label}
                {activeSubTab === sub.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 animate-in fade-in slide-in-from-bottom-1" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* View Content */}
        <div className="min-h-[400px]">
          {activeTab === "users" && activeSubTab === "list" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <UsersManagement
                users={enrichedUsers}
                loading={loadingUsers}
                onRefresh={loadUsersData}
                dropdowns={dropdowns}
              />
            </div>
          )}
          {activeTab === "users" && activeSubTab === "tracking" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <UserTrackingView />
            </div>
          )}

          {activeTab === "projects" && activeSubTab === "projects_list" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ProjectsManagement
                projects={projects}
                loading={loadingProjects}
                onRefresh={loadProjectsData}
                dropdowns={dropdowns}
              />
            </div>
          )}
          {activeTab === "projects" && activeSubTab === "monthly_target" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <UserMonthlyTargetCard />
            </div>
          )}
          {activeTab === "projects" && activeSubTab === "category" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ProjectCategoryManagement />
            </div>
          )}
          {activeTab === "projects" && activeSubTab === "afd" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <AFDManagement />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageView;
