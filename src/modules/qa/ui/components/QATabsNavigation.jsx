import React from 'react';
import {
  LayoutGrid,
  Briefcase,
  Users,
  FileWarning,
  DollarSign
} from 'lucide-react';

const QATabsNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'billable_report', label: 'Billable Report', icon: Briefcase },
    { id: 'agents', label: 'Agent Performance', icon: Users, disabled: true },
    { id: 'adherence', label: 'Reporting Adherence', icon: FileWarning, disabled: true },
    { id: 'incentives', label: 'Agent Incentives', icon: DollarSign, disabled: true }
  ];

  return (
    <div className="relative w-full">
      <div
        className="flex overflow-x-auto pb-2 px-1 scroll-smooth scrollbar-hide snap-x snap-mandatory w-full gap-2 lg:justify-between"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={
                `grow lg:grow-0 px-4 sm:px-4 py-3 sm:py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap snap-start ` +
                (isActive
                  ? 'bg-white border  text-blue-600 border-blue-600 shadow-md'
                  : 'bg-white shadow border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-slate-300')
              }
              title={tab.label}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">{tab.label}</span>
              <span className="xs:hidden">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QATabsNavigation;
