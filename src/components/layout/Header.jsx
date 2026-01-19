import React, { useState, useEffect } from "react";
// Role ID to role string mapping
const ROLE_MAP = {
  1: "SUPER_ADMIN",
  2: "ADMIN",
  3: "PROJECT_MANAGER",
  4: "ASSISTANT_MANAGER",
  5: "QA_AGENT",
  6: "AGENT"
};
import { ViewState } from "../../lib/constants";
import {
  LayoutDashboard,
  PenTool,
  Database,
  LogOut,
  Settings,
  Award,
  CalendarClock,
  BookOpen,
  Menu,
  X,
  FileText,
  Users
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

const Header = ({
  currentUser,
  handleLogout
}) => {
  // Debug: Log currentUser to check available properties
  useEffect(() => {
    console.log('Header currentUser:', currentUser);
  }, [currentUser]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  // useLocation in TanStack returns the current location object

  // Get role label from role_id or role string
  const getRoleLabel = () => {
    if (currentUser?.role_id) {
      const roleName = ROLE_MAP[Number(currentUser.role_id)] || "";
      return roleName.replace("_", " ").replace("SUPER ADMIN", "Admin");
    }
    // fallback to role string
    return (currentUser?.role || currentUser?.role_name || currentUser?.user_role || "").toString();
  };

  // -----------------------------
  // ROUTE MAP
  // -----------------------------
     const ROUTES = {
       DASHBOARD: "/dashboard",
       ADMIN_PANEL: "/admin",
       ENTRY: "/entry",
       GUIDELINES: "/guidelines",
       SCHEDULER: "/scheduler",
       QUALITY: "/quality"
     };

  // Helper for Navigation with role-based routing
  const goTo = (view) => {
    const roleId = Number(currentUser?.role_id);
    const role = (currentUser?.role || currentUser?.role_name || currentUser?.user_role || '').toString().toUpperCase();
    
    console.log('🚀 [Header goTo] view:', view, 'roleId:', roleId, 'role:', role);
    
    // Helper to safely navigate with string parsable options if simple string doesn't work
    // But for TanStack, we should target specific routes.
    // Here we'll map view codes to destinations.

    let targetPath = "/dashboard"; // default
    let search = {};

    // Handle QA-specific views
    if (view === 'TRACKER_REPORT') {
      console.log('🚀 [Header goTo] Navigating to Tracker Report');
      targetPath = '/dashboard';
      search = { view: 'tracker-report' };
    }
    else if (view === 'AGENT_LIST') {
      console.log('🚀 [Header goTo] Navigating to Agent List');
       targetPath = '/dashboard';
       search = { view: 'agent-list' };
    }
    // Handle Manage tab for Assistant Managers - route to /dashboard with tab=manage
    else if (view === ViewState.ADMIN_PANEL && roleId === 4) {
      console.log('🚀 [Header goTo] Navigating Assistant Manager to /dashboard with tab=manage');
       targetPath = '/dashboard';
       search = { tab: 'manage' };
    }
    
    // For agents (role_id 6 or role includes 'AGENT')
    else if (roleId === 6 || role.includes('AGENT')) {
      if (view === ViewState.ENTRY || view === 'ENTRY') {
        console.log('🚀 [Header goTo] Navigating agent to /agent');
        targetPath = "/agent";
      } else if (view === ViewState.DASHBOARD || view === 'DASHBOARD') {
        console.log('🚀 [Header goTo] Navigating agent to /dashboard');
        targetPath = "/dashboard";
      } else {
        targetPath = ROUTES[view] || "/agent";
        console.log('🚀 [Header goTo] Navigating agent to:', targetPath);
      }
    } else {
      // For admins and other roles
      targetPath = ROUTES[view] || "/dashboard";
      console.log('🚀 [Header goTo] Navigating non-agent to:', targetPath);
    }
    
    navigate({ to: targetPath, search: Object.keys(search).length ? search : undefined });
    setIsMobileMenuOpen(false);
  };

  // -----------------------------
  // Nav Items (Header Buttons)
  // -----------------------------

  const getNavItems = () => {
    const role = (currentUser?.role || currentUser?.role_name || currentUser?.user_role || '').toString().toUpperCase();
    if (!role) {
      // Try role_id mapping if role string is missing
      if (currentUser?.role_id) {
        const roleId = Number(currentUser.role_id);
        
        // Agent tabs (role_id 6)
        if (roleId === 6) return [
          { view: ViewState.DASHBOARD, label: "Analytics", icon: LayoutDashboard },
          { view: ViewState.ENTRY, label: "Tracker", icon: PenTool },
          { view: ViewState.SCHEDULER, label: "Roster", icon: CalendarClock },
        ];
        
        // QA tabs (role_id 5) - Hide Manage and User Tracking
        if (roleId === 5) return [
          { view: ViewState.DASHBOARD, label: "Analytics", icon: LayoutDashboard },
          { view: ViewState.QUALITY, label: "Quality", icon: Award },
          { view: ViewState.SCHEDULER, label: "Scheduler", icon: CalendarClock },
          { view: "TRACKER_REPORT", label: "Tracker Report", icon: FileText },
          { view: "AGENT_LIST", label: "Agent List", icon: Users },
        ];
        
        // Assistant Manager tabs (role_id 4)
        if (roleId === 4) return [
          { view: ViewState.DASHBOARD, label: "Analytics", icon: LayoutDashboard },
          { view: ViewState.SCHEDULER, label: "Scheduler", icon: CalendarClock },
          { view: "TRACKER_REPORT", label: "Tracker Report", icon: FileText },
          { view: "AGENT_LIST", label: "Agent List", icon: Users },
          { view: ViewState.ADMIN_PANEL, label: "Manage", icon: Settings },
          { view: ViewState.ENTRY, label: "User Tracking", icon: PenTool },
        ];
        
        // All other role_ids are treated as Admin for tab purposes
        return [
          { view: ViewState.DASHBOARD, label: "Analytics", icon: LayoutDashboard },
          { view: ViewState.QUALITY, label: "Quality", icon: Award },
          { view: ViewState.SCHEDULER, label: "Scheduler", icon: CalendarClock },
          { view: ViewState.ADMIN_PANEL, label: "Manage", icon: Settings },
          { view: ViewState.ENTRY, label: "User Tracking", icon: PenTool },
        ];
      }
      return [];
    }
    
    // QA tabs (by role string) - Hide Manage and User Tracking
    if (role.includes('QA')) {
      return [
        { view: ViewState.DASHBOARD, label: "Analytics", icon: LayoutDashboard },
        { view: ViewState.QUALITY, label: "Quality", icon: Award },
        { view: ViewState.SCHEDULER, label: "Scheduler", icon: CalendarClock },
        { view: "TRACKER_REPORT", label: "Tracker Report", icon: FileText },
        { view: "AGENT_LIST", label: "Agent List", icon: Users },
      ];
    }
    
    // Assistant Manager tabs (by role string)
    if (role.includes('ASSISTANT') || role.includes('ASST')) {
      return [
        { view: ViewState.DASHBOARD, label: "Analytics", icon: LayoutDashboard },
        { view: ViewState.SCHEDULER, label: "Scheduler", icon: CalendarClock },
        { view: "TRACKER_REPORT", label: "Tracker Report", icon: FileText },
        { view: "AGENT_LIST", label: "Agent List", icon: Users },
        { view: ViewState.ADMIN_PANEL, label: "Manage", icon: Settings },
        { view: ViewState.ENTRY, label: "User Tracking", icon: PenTool },
      ];
    }
    
    // Admin tabs
    if (role.includes('ADMIN')) {
      return [
        { view: ViewState.DASHBOARD, label: "Analytics", icon: LayoutDashboard },
        { view: ViewState.QUALITY, label: "Quality", icon: Award },
        { view: ViewState.SCHEDULER, label: "Scheduler", icon: CalendarClock },
        { view: ViewState.ADMIN_PANEL, label: "Manage", icon: Settings },
        { view: ViewState.ENTRY, label: "User Tracking", icon: PenTool },
      ];
    }
    
    // Agent tabs (by role string)
    if (role.includes('AGENT')) {
      return [
        { view: ViewState.DASHBOARD, label: "Analytics", icon: LayoutDashboard },
        { view: ViewState.ENTRY, label: "Tracker", icon: PenTool },
        { view: ViewState.SCHEDULER, label: "Roster", icon: CalendarClock },
      ];
    }
    
    // Default: show nothing or fallback
    return [];
  };

  const navItems = getNavItems();

  // -----------------------------
  // NAV BUTTON UI (Desktop)
  // -----------------------------
  const renderNavButton = (item) => (
    <button
      key={item.view}
      onClick={() => goTo(item.view)}
      className="flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap text-slate-600 bg-slate-50 hover:bg-slate-200 cursor-pointer"
    >
      <item.icon className="w-4 h-4" />
      <span className="hidden md:inline">{item.label}</span>
    </button>
  );

  // -----------------------------
  // NAV BUTTON UI (Mobile)
  // -----------------------------
  const renderMobileNavButton = (item) => (
    <button
      key={item.view}
      onClick={() => goTo(item.view)}
      className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors w-full text-slate-700 bg-slate-50 hover:bg-slate-200 cursor-pointer"
    >
      <item.icon className="w-5 h-5" />
      <span>{item.label}</span>
    </button>
  );

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
              <div className="bg-blue-200 p-2 rounded-lg">
                <Database className="w-5 h-5 text-blue-700" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-xl font-bold text-blue-700">
                  TFS Ops Tracker
                </span>
                <span className="text-xs text-blue-400 font-semibold tracking-wide">
                  {getRoleLabel() ? `${getRoleLabel()} View` : ""}
                </span>
              </div>
            </div>

            {/* NAVIGATION + USER INFO + LOGOUT */}
            <div className="flex flex-1 items-center justify-end space-x-6">
              <div className="hidden lg:flex items-center space-x-2">
                {navItems.map(renderNavButton)}
              </div>
              <div className="flex items-center gap-2 border-l border-slate-200 pl-4 min-w-[180px]">
                <div className="text-right">
                  <span className="font-semibold text-slate-800">
                    {currentUser?.user_name || currentUser?.name || currentUser?.username || currentUser?.email || "User"}
                  </span>
                  <br />
                  <span className="text-xs text-slate-400 font-medium">
                    {getRoleLabel()}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (typeof handleLogout === 'function') {
                      handleLogout();
                    } else if (window && window.sessionStorage) {
                      window.sessionStorage.clear();
                      window.location.href = '/';
                    }
                  }}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      <div className={`
        fixed top-0 right-0 h-full bg-white shadow-xl z-50
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        w-80 max-w-[85vw] md:hidden border-l border-slate-200
      `}>
        <div className="p-6 flex flex-col h-full">

          {/* USER INFO */}
          <div className="pb-6 mb-6 border-b border-slate-200">
            <h3 className="font-bold text-xl">{currentUser?.name}</h3>
            <p className="text-sm text-slate-500">
              {currentUser?.designation || currentUser?.role}
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
              handleLogout();
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 w-full transition-colors mt-6 border-t border-slate-200 pt-6 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>

        </div>
      </div>
    </>
  );
};

export default Header;
