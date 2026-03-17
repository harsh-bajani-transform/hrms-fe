import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid,
  Briefcase,
  FileText,
  BarChart3,
  Settings,
} from "lucide-react";

export interface TabsNavigationProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  isAgent: boolean;
  isQA: boolean;
  canAccessManage?: boolean;
}

interface TabDef {
  id: string;
  label: string;
  icon: LucideIcon;
  alwaysVisible?: boolean;
  visible?: boolean;
}

const TabsNavigation = ({
  activeTab,
  setActiveTab,
  isAgent,
  isQA,
}: TabsNavigationProps) => {
  const tabsRef = useRef<HTMLDivElement | null>(null);

  const tabs: TabDef[] = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutGrid,
      alwaysVisible: true,
    },
    {
      id: "monthly_target",
      label: "User Monthly Target",
      icon: Briefcase,
      visible: !isAgent && !isQA,
    },
    {
      id: "billable_report",
      label: "Billable Reports",
      icon: FileText,
      visible: true,
    },
    {
      id: "tracker_report",
      label: "Tracker Report",
      icon: BarChart3,
      visible: !isAgent,
    },
    {
      id: "agent_file_report",
      label: "Agent File Report",
      icon: LayoutGrid, // Using LayoutGrid for now
      visible: !isAgent,
    },
    {
      id: "qa_agent_audit",
      label: "QA Agent Audit",
      icon: Briefcase,
      visible: !isAgent,
    },
    {
      id: "project_monthly_report",
      label: "Project Monthly Report",
      icon: BarChart3,
      visible: !isAgent && !isQA,
    },
    {
      id: "afd_management",
      label: "AFD Management",
      icon: Settings,
      visible: !isAgent,
    },
  ];

  const visibleTabs = tabs.filter((tab) => tab.alwaysVisible || tab.visible);

  return (
    <div className="relative w-full bg-white rounded p-4 shadow-sm border border-gray-200">
      {/* Horizontal draggable/scrollable + equal spacing on large screens */}
      <div
        ref={tabsRef}
        className="flex flex-row overflow-x-auto pb-2 px-1 scroll-smooth scrollbar-hide snap-x snap-mandatory w-full gap-2 lg:gap-3"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                shrink-0
                px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg text-sm font-medium
                flex items-center justify-center gap-2
                transition-all duration-200 whitespace-nowrap snap-start cursor-pointer
                ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md scale-105"
                    : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 hover:shadow-sm"
                }
              `}
              title={tab.label}
            >
              <Icon
                className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-600"}`}
              />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabsNavigation;
