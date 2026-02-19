import { useState } from "react";
import {
  FileText,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  PenTool,
  Settings,
  Sparkles,
  User as UserIcon,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import GeminiKeyModal from "../GeminiKeyModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Link,
  useLocation,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import type { User } from "../../context/AuthContext";
import type { DashboardSearchParams } from "../../routes/dashboard";

import logo from "../../assets/Transform logo.png";

// Role ID to role string mapping
const ROLE_MAP: Record<number, string> = {
  1: "SUPER_ADMIN",
  2: "ADMIN",
  3: "PROJECT_MANAGER",
  4: "ASSISTANT_MANAGER",
  5: "QA_AGENT",
  6: "AGENT",
};

type HeaderView =
  | "DASHBOARD"
  | "ADMIN_PANEL"
  | "ENTRY"
  | "TRACKER_REPORT"
  | "AGENT_LIST"
  | "AI_EVALUATION";
type TargetPath = "/dashboard" | "/admin" | "/entry" | "/agent";

type LooseSearch = {
  tab?: string;
  view?: string;
};

interface NavItem {
  view: HeaderView;
  label: string;
  icon: LucideIcon;
}

export interface HeaderProps {
  currentUser: User | null;
  handleLogout?: () => void;
}

const Header = ({ currentUser, handleLogout }: HeaderProps) => {
  // Helper to get initials from user's name
  const getInitials = (): string => {
    const name =
      currentUser?.name ||
      currentUser?.user_name ||
      currentUser?.username ||
      "";

    if (!name) return "";

    const parts = name.trim().split(" ");
    const first = parts[0]?.[0]?.toUpperCase() ?? "";

    if (parts.length === 1) {
      return first;
    }

    const last = parts[parts.length - 1]?.[0]?.toUpperCase() ?? "";
    return `${first}${last}`;
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [geminiKeyOpen, setGeminiKeyOpen] = useState(false);
  const navigate = useNavigate();

  // Get role label from role_id or role string
  const getRoleLabel = () => {
    if (currentUser?.role_id) {
      const roleName = ROLE_MAP[Number(currentUser.role_id)] || "";
      return roleName.replace("_", " ").replace("SUPER ADMIN", "Admin");
    }
    // fallback to role string
    return (
      currentUser?.role ||
      currentUser?.role_name ||
      currentUser?.user_role ||
      ""
    ).toString();
  };

  // -----------------------------
  // ROUTE MAP
  // -----------------------------
  // Helper for Navigation with role-based routing
  const goTo = (view: HeaderView): void => {
    const roleId = Number(currentUser?.role_id);
    const role = String(
      currentUser?.role ??
        currentUser?.role_name ??
        currentUser?.user_role ??
        "",
    ).toUpperCase();

    let targetPath: TargetPath = "/dashboard";
    let dashboardSearch: DashboardSearchParams | undefined;

    // QA-specific views
    if (view === "TRACKER_REPORT") {
      targetPath = "/dashboard";
      dashboardSearch = { view: "tracker-report" };
    } else if (view === "AGENT_LIST") {
      targetPath = "/dashboard";
      dashboardSearch = { view: "agent-list" };
    } else if (view === "AI_EVALUATION") {
      targetPath = "/agent";
      dashboardSearch = { tab: "ai_evaluation" };
    }

    // Assistant Manager: Manage lives under /dashboard?tab=manage
    else if (view === "ADMIN_PANEL" && roleId === 4) {
      targetPath = "/dashboard";
      dashboardSearch = { tab: "manage" };
    }

    // Agents: entry goes to /agent, dashboard goes to /dashboard
    else if (roleId === 6 || role.includes("AGENT")) {
      targetPath = view === "ENTRY" ? "/agent" : "/dashboard";
    }

    // Admin/PM/QA/etc
    else {
      if (view === "ADMIN_PANEL") {
        targetPath = "/admin";
      } else if (view === "ENTRY") {
        targetPath = "/entry";
      } else {
        targetPath = "/dashboard";
        dashboardSearch = { tab: "overview" };
      }
    }

    navigate({
      to: targetPath,
      ...(dashboardSearch ? { search: dashboardSearch } : {}),
    });

    setIsMobileMenuOpen(false);
  };

  // -----------------------------
  // Nav Items (Header Buttons)
  // -----------------------------

  const getNavItems = (): NavItem[] => {
    const role = (
      currentUser?.role ||
      currentUser?.role_name ||
      currentUser?.user_role ||
      ""
    )
      .toString()
      .toUpperCase();
    if (!role) {
      // Try role_id mapping if role string is missing
      if (currentUser?.role_id) {
        const roleId = Number(currentUser.role_id);

        // Agent tabs (role_id 6)
        if (roleId === 6)
          return [
            {
              view: "DASHBOARD",
              label: "Analytics",
              icon: LayoutDashboard,
            },
            { view: "ENTRY", label: "Tracker", icon: PenTool },
            {
              view: "AI_EVALUATION",
              label: "AI Evaluation",
              icon: Sparkles,
            },
            // { view: ViewState.SCHEDULER, label: "Roster", icon: CalendarClock },
          ];

        // QA tabs (role_id 5)
        if (roleId === 5)
          return [
            {
              view: "DASHBOARD",
              label: "Analytics",
              icon: LayoutDashboard,
            },
            { view: "TRACKER_REPORT", label: "Tracker Report", icon: FileText },
            { view: "AGENT_LIST", label: "Agent File Report", icon: Users },
          ];

        // Project Manager tabs (role_id 3)
        if (roleId === 3)
          return [
            {
              view: "DASHBOARD",
              label: "Analytics",
              icon: LayoutDashboard,
            },
            { view: "ADMIN_PANEL", label: "Manage", icon: Settings },
            { view: "ENTRY", label: "User Permission", icon: PenTool },
          ];

        // Assistant Manager tabs (role_id 4)
        if (roleId === 4)
          return [
            {
              view: "DASHBOARD",
              label: "Analytics",
              icon: LayoutDashboard,
            },
            { view: "TRACKER_REPORT", label: "Tracker Report", icon: FileText },
            { view: "AGENT_LIST", label: "Agent File Report", icon: Users },
            { view: "ADMIN_PANEL", label: "Manage", icon: Settings },
            { view: "ENTRY", label: "User Permission", icon: PenTool },
          ];

        // All other role_ids (Admin/Super Admin)
        return [
          {
            view: "DASHBOARD",
            label: "Analytics",
            icon: LayoutDashboard,
          },
          { view: "ADMIN_PANEL", label: "Manage", icon: Settings },
          { view: "ENTRY", label: "User Permission", icon: PenTool },
        ];
      }
      return [];
    }

    // QA tabs (by role string)
    if (role.includes("QA")) {
      return [
        {
          view: "DASHBOARD",
          label: "Analytics",
          icon: LayoutDashboard,
        },
        { view: "TRACKER_REPORT", label: "Tracker Report", icon: FileText },
        { view: "AGENT_LIST", label: "Agent File Report", icon: Users },
      ];
    }

    // Assistant Manager tabs (by role string)
    if (role.includes("ASSISTANT") || role.includes("ASST")) {
      return [
        {
          view: "DASHBOARD",
          label: "Analytics",
          icon: LayoutDashboard,
        },
        { view: "TRACKER_REPORT", label: "Tracker Report", icon: FileText },
        { view: "AGENT_LIST", label: "Agent File Report", icon: Users },
        { view: "ADMIN_PANEL", label: "Manage", icon: Settings },
        { view: "ENTRY", label: "User Permission", icon: PenTool },
      ];
    }

    // Project Manager tabs (by role string)
    if (role.includes("PROJECT_MANAGER")) {
      return [
        {
          view: "DASHBOARD",
          label: "Analytics",
          icon: LayoutDashboard,
        },
        { view: "ADMIN_PANEL", label: "Manage", icon: Settings },
        { view: "ENTRY", label: "User Permission", icon: PenTool },
      ];
    }

    // Admin tabs
    if (role.includes("ADMIN")) {
      return [
        {
          view: "DASHBOARD",
          label: "Analytics",
          icon: LayoutDashboard,
        },
        { view: "ADMIN_PANEL", label: "Manage", icon: Settings },
        { view: "ENTRY", label: "User Permission", icon: PenTool },
      ];
    }

    // Agent tabs (by role string)
    if (role.includes("AGENT")) {
      return [
        {
          view: "DASHBOARD",
          label: "Analytics",
          icon: LayoutDashboard,
        },
        { view: "ENTRY", label: "Tracker", icon: PenTool },
        {
          view: "AI_EVALUATION",
          label: "AI Evaluation",
          icon: Sparkles,
        },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  const { pathname } = useLocation();
  const search = useSearch({ strict: false }) as LooseSearch;

  // -----------------------------
  // NAV BUTTON UI (Desktop)
  // -----------------------------
  const renderNavButton = (item: NavItem) => {
    // Determine if this nav item is active
    let isActive = false;

    // Logic to determine active state based on route and view/tab search params
    if (
      item.view === "DASHBOARD" ||
      item.view === "TRACKER_REPORT" ||
      item.view === "AGENT_LIST"
    ) {
      isActive =
        pathname === "/dashboard" && (!search.tab || search.tab !== "manage");

      // Fine-grained active state for QA views if they are in the header
      if (item.view === "TRACKER_REPORT") {
        isActive =
          pathname === "/dashboard" && search.view === "tracker-report";
      } else if (item.view === "AGENT_LIST") {
        isActive = pathname === "/dashboard" && search.view === "agent-list";
      } else if (item.view === "DASHBOARD") {
        // Analytics is active if we are on dashboard and NOT on a specific sub-view
        isActive =
          pathname === "/dashboard" &&
          !search.view &&
          (!search.tab || search.tab === "overview");
      }
    } else if (item.view === "ADMIN_PANEL") {
      // Manage can be /admin OR /dashboard?tab=manage
      isActive =
        pathname === "/admin" ||
        (pathname === "/dashboard" && search.tab === "manage");
    } else if (item.view === "ENTRY") {
      isActive =
        (pathname === "/entry" || pathname === "/agent") &&
        search.tab !== "ai_evaluation";
    } else if (item.view === "AI_EVALUATION") {
      isActive = pathname === "/agent" && search.tab === "ai_evaluation";
    }

    return (
      <button
        key={item.view}
        onClick={() => goTo(item.view)}
        className={`
          flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all whitespace-nowrap cursor-pointer
          ${
            isActive
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 bg-slate-50 hover:bg-slate-200"
          }
        `}
      >
        <item.icon className={`w-4 h-4 ${isActive ? "text-white" : ""}`} />
        <span className="hidden md:inline">{item.label}</span>
      </button>
    );
  };

  // -----------------------------
  // NAV BUTTON UI (Mobile)
  // -----------------------------
  const renderMobileNavButton = (item: NavItem) => {
    let isActive = false;
    if (
      item.view === "DASHBOARD" ||
      item.view === "TRACKER_REPORT" ||
      item.view === "AGENT_LIST"
    ) {
      isActive =
        pathname === "/dashboard" && (!search.tab || search.tab !== "manage");
      if (item.view === "TRACKER_REPORT") {
        isActive =
          pathname === "/dashboard" && search.view === "tracker-report";
      } else if (item.view === "AGENT_LIST") {
        isActive = pathname === "/dashboard" && search.view === "agent-list";
      } else if (item.view === "DASHBOARD") {
        isActive =
          pathname === "/dashboard" &&
          !search.view &&
          (!search.tab || search.tab === "overview");
      }
    } else if (item.view === "ADMIN_PANEL") {
      isActive =
        pathname === "/admin" ||
        (pathname === "/dashboard" && search.tab === "manage");
    } else if (item.view === "ENTRY") {
      isActive =
        (pathname === "/entry" || pathname === "/agent") &&
        search.tab !== "ai_evaluation";
    } else if (item.view === "AI_EVALUATION") {
      isActive = pathname === "/agent" && search.tab === "ai_evaluation";
    }

    return (
      <button
        key={item.view}
        onClick={() => goTo(item.view)}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold transition-all w-full cursor-pointer
          ${
            isActive
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-700 bg-slate-50 hover:bg-slate-200"
          }
        `}
      >
        <item.icon className={`w-5 h-5 ${isActive ? "text-white" : ""}`} />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl ml-auto mr-16 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* LOGO + TITLE */}
            <div className="flex items-center gap-2">
              <Link to={"/dashboard"}>
                <img
                  src={logo}
                  alt="TFS Ops Tracker Logo"
                  className="h-10 w-auto"
                />
              </Link>
            </div>

            {/* NAVIGATION + USER INFO + LOGOUT */}
            <div className="flex flex-1 items-center justify-end space-x-6">
              <div className="hidden lg:flex items-center space-x-2">
                {navItems.map(renderNavButton)}
              </div>
              <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer outline-none">
                      <Avatar className="w-10 h-10 border-2 border-slate-100">
                        <AvatarImage
                          src={
                            currentUser?.avatar_url ||
                            currentUser?.profile_picture
                          }
                        />
                        <AvatarFallback className="bg-blue-700 text-white font-bold">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col items-center justify-center space-y-1 py-1">
                        <p className="text-sm font-bold leading-none">
                          {currentUser?.name ||
                            currentUser?.user_name ||
                            "User"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground mt-1">
                          {String(
                            currentUser?.user_email ||
                              currentUser?.email ||
                              currentUser?.username ||
                              "no-email@tfs.com",
                          )}
                        </p>
                        <p className="text-slate-500 cursor-default">
                          <span className="font-medium text-xs">
                            {getRoleLabel() || "No Role"}
                          </span>
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setGeminiKeyOpen(true)}
                      className="cursor-pointer py-2 text-purple-700 focus:text-purple-700 focus:bg-purple-50"
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      <span>Gemini AI Key</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        if (typeof handleLogout === "function") {
                          handleLogout();
                        } else if (window && window.sessionStorage) {
                          window.sessionStorage.clear();
                          window.location.assign("/");
                        }
                      }}
                      className="text-red-600 focus:text-red-600 cursor-pointer py-2"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      <div
        className={`
        fixed top-0 right-0 h-full bg-white shadow-xl z-50
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}
        w-80 max-w-[85vw] md:hidden border-l border-slate-200
      `}
      >
        <div className="p-6 flex flex-col h-full">
          {/* USER INFO */}
          <div className="pb-6 mb-6 border-b border-slate-200">
            <h3 className="font-bold text-xl">
              {currentUser?.name || currentUser?.user_name}
            </h3>
            <p className="text-sm text-slate-500">
              {String(
                currentUser?.designation ??
                  (currentUser as Record<string, unknown> | null)?.role ??
                  "",
              )}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {getRoleLabel() ? `${getRoleLabel()} View` : ""}
            </p>
          </div>

          {/* NAV ITEMS */}
          <div className="flex-1 space-y-2">
            {navItems.map(renderMobileNavButton)}
          </div>

          {/* LOGOUT */}
          <button
            onClick={() => {
              if (typeof handleLogout === "function") {
                handleLogout();
              } else if (window && window.sessionStorage) {
                window.sessionStorage.clear();
                window.location.assign("/");
              }
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 w-full transition-colors mt-6 border-t border-slate-200 pt-6 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
      <GeminiKeyModal
        isOpen={geminiKeyOpen}
        onClose={() => setGeminiKeyOpen(false)}
      />
    </>
  );
};

export default Header;
