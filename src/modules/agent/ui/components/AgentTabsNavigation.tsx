import type { Dispatch, SetStateAction } from "react";
import {
  Briefcase,
  DollarSign,
  FileWarning,
  LayoutGrid,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AgentTabId, AgentTabsNavigationProps, TabDef } from "../../types";

const tabs: TabDef[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "billable_report", label: "Billable Report", icon: Briefcase },
  { id: "projects", label: "My Tasks & Projects", icon: Users },
  {
    id: "adherence",
    label: "Reporting Adherence",
    icon: FileWarning,
    disabled: true,
  },
  {
    id: "incentives",
    label: "Agent Incentives",
    icon: DollarSign,
    disabled: true,
  },
];

const AgentTabsNavigation = ({
  activeTab,
  setActiveTab,
}: AgentTabsNavigationProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
      <div
        className="flex overflow-x-auto scroll-smooth scrollbar-hide gap-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={`
                shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg text-sm font-medium
                flex items-center justify-center gap-2
                transition-all duration-200 whitespace-nowrap
                ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md scale-105"
                    : tab.disabled
                      ? "bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed"
                      : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 hover:shadow-sm"
                }
              `}
              title={tab.label}
              type="button"
            >
              <Icon
                className={`w-4 h-4 ${isActive ? "text-white" : tab.disabled ? "text-gray-400" : "text-gray-600"}`}
              />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AgentTabsNavigation;
