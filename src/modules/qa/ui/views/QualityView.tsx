import { useState } from 'react'
import { useSearch } from '@tanstack/react-router'

import QADashboardView from './QADashboardView'
import QAAgentListView from './QAAgentListView'
import QATrackerReportView from './QATrackerReportView'

type QualitySubTab = 'qa-dashboard' | 'tracker-report' | 'agent-list'

type QualitySearch = {
  view?: string
}

const QualityView = () => {
  const searchParams = useSearch({ strict: false }) as QualitySearch
  const viewParam = searchParams.view

  const [qualitySubTab, setQualitySubTab] = useState<QualitySubTab>(() => {
    if (viewParam === 'tracker-report') return 'tracker-report'
    if (viewParam === 'agent-list') return 'agent-list'
    return 'qa-dashboard'
  })

  return (
    <div className="space-y-6">
      {/* Quality Sub-Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setQualitySubTab('qa-dashboard')}
            className={`flex-1 px-5 py-3 text-sm font-medium transition-all duration-200 rounded-lg ${
              qualitySubTab === 'qa-dashboard'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:shadow-sm'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setQualitySubTab('tracker-report')}
            className={`flex-1 px-5 py-3 text-sm font-medium transition-all duration-200 rounded-lg ${
              qualitySubTab === 'tracker-report'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:shadow-sm'
            }`}
          >
            Tracker Report
          </button>
          <button
            onClick={() => setQualitySubTab('agent-list')}
            className={`flex-1 px-5 py-3 text-sm font-medium transition-all duration-200 rounded-lg ${
              qualitySubTab === 'agent-list'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:shadow-sm'
            }`}
          >
            Agent List
          </button>
        </div>
      </div>
      
      {/* Quality Sub-Tab Content */}
      <div>
        {qualitySubTab === 'qa-dashboard' && <QADashboardView />}
        {qualitySubTab === 'tracker-report' && <QATrackerReportView />}
        {qualitySubTab === 'agent-list' && <QAAgentListView />}
      </div>
    </div>
  );
}

export default QualityView
