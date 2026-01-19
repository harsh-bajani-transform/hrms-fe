import React, { useRef } from 'react';
import {
  LayoutGrid,
  Briefcase,
  Users,
  FileWarning,
  DollarSign,
  Gem,
  ClipboardCheck
} from 'lucide-react';

const TabsNavigation = ({
  activeTab,
  setActiveTab,
  isAgent,
  isQA,
  canViewIncentivesTab,
  canViewAdherence
}) => {
  const tabsRef = useRef(null);
    
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid, alwaysVisible: true },
    { id: 'bookings', label: 'Project Bookings', icon: Briefcase, visible: !isAgent && !isQA },
    { id: 'agents', label: 'Agent Performance', icon: Users, visible: !isQA },
    { id: 'adherence', label: 'Reporting Adherence', icon: FileWarning, visible: canViewAdherence && !isQA },
    { id: 'incentives', label: 'Agent Incentives', icon: DollarSign, visible: canViewIncentivesTab && !isQA },
    { id: 'mgmt_incentives', label: 'Management Incentives', icon: Gem, visible: !isAgent && !isQA }
  ];

  const visibleTabs = tabs.filter(tab => tab.alwaysVisible || tab.visible);

  return (
    <div className="relative w-full">
      {/* Horizontal draggable/scrollable + equal spacing on large screens */}
      <div
        ref={tabsRef}
        className="
          flex overflow-x-auto pb-2 px-1 scroll-smooth scrollbar-hide snap-x snap-mandatory
          w-full gap-2
          lg:justify-between
        "
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {visibleTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                grow lg:grow-0
                px-4 sm:px-4 py-3 sm:py-3 rounded-lg text-sm font-semibold 
                flex items-center justify-center gap-1.5 sm:gap-2 
                transition-all whitespace-nowrap snap-start cursor-pointer
                bg-white shadow border border-slate-200
                ${isActive 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                  : 'text-slate-600 hover:text-blue-600 hover:border-slate-300'
                }
              `}
              title={tab.label}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">{tab.label}</span>
              <span className="xs:hidden">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Dropdown */}
      <div className="sm:hidden mt-2">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm font-medium cursor-pointer"
        >
          {visibleTabs.map(tab => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TabsNavigation;
