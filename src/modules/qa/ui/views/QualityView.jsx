import React, { useState } from 'react';
import QADashboardView from './QADashboardView';
import QATrackerReportView from './QATrackerReportView';
import QAAgentListView from './QAAgentListView';
import { useSearch } from '@tanstack/react-router';

const QualityView = () => {
  const searchParams = useSearch({ strict: false });
  const viewParam = searchParams.view;
  
  // Set initial sub-tab based on search param or default
  const [qualitySubTab, setQualitySubTab] = useState(() => {
    if (viewParam === 'tracker-report') return 'tracker-report';
    if (viewParam === 'agent-list') return 'agent-list';
    return 'qa-dashboard';
  });

  return (
    <div className="space-y-4">
      {/* Quality Sub-Navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setQualitySubTab('qa-dashboard')}
          className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
            qualitySubTab === 'qa-dashboard'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setQualitySubTab('tracker-report')}
          className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
            qualitySubTab === 'tracker-report'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Tracker Report
        </button>
        <button
          onClick={() => setQualitySubTab('agent-list')}
          className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
            qualitySubTab === 'agent-list'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Agent List
        </button>
      </div>
      
      {/* Quality Sub-Tab Content */}
      <div className="mt-4">
        {qualitySubTab === 'qa-dashboard' && <QADashboardView />}
        {qualitySubTab === 'tracker-report' && <QATrackerReportView />}
        {qualitySubTab === 'agent-list' && <QAAgentListView />}
      </div>
    </div>
  );
};

export default QualityView;
