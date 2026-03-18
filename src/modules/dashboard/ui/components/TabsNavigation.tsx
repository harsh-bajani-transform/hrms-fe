import type { LucideIcon } from "lucide-react";
import { LayoutGrid, Briefcase, FileText, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const tabs: TabDef[] = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutGrid,
      alwaysVisible: true,
    },
    {
      id: "billable_report",
      label: "Billable Reports",
      icon: FileText,
      visible: true,
    },
    {
      id: "monthly_target",
      label: "User Monthly Target",
      icon: Briefcase,
      visible: !isAgent && !isQA,
    },
    {
      id: "project_monthly_report",
      label: "Project Monthly Report",
      icon: BarChart3,
      visible: !isAgent && !isQA,
    },
    // {
    //   id: "agent_file_report",
    //   label: "Agent File Report",
    //   icon: Users,
    //   visible: !isAgent,
    // },
    // {
    //   id: "qa_agent_audit",
    //   label: "QA Agent Audit",
    //   icon: Briefcase,
    //   visible: !isAgent,
    // },
    // {
    //   id: "afd_management",
    //   label: "AFD Management",
    //   icon: Settings,
    //   visible: !isAgent,
    // },
  ];

  const visibleTabs = tabs.filter((tab) => tab.alwaysVisible || tab.visible);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-6">
      <div className="flex border-b border-slate-200">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 px-4 py-4 text-sm font-bold transition-all relative min-w-[120px]",
                isActive
                  ? "text-blue-600 bg-blue-50"
                  : "text-slate-600 hover:text-slate-800 hover:bg-slate-50",
              )}
              title={tab.label}
            >
              <div className="flex items-center justify-center gap-2">
                <Icon
                  className={cn(
                    "w-4 h-4",
                    isActive ? "text-blue-600" : "text-slate-400",
                  )}
                />
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{tab.label.split(" ")[0]}</span>
              </div>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabsNavigation;
