import React from "react";
import { Filter } from "lucide-react";
import type { UserRef } from "../../../dashboard/types";

interface QATrackerReportFiltersProps {
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  selectedAgent: string;
  setSelectedAgent: (agentId: string) => void;
  assignedAgents: UserRef[];
  isLoadingAgents: boolean;
  onClearFilters: () => void;
}

const QATrackerReportFilters: React.FC<QATrackerReportFiltersProps> = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  selectedAgent,
  setSelectedAgent,
  assignedAgents,
  isLoadingAgents,
  onClearFilters,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Filter className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Filter Options</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Start Date */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* End Date */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700">
            End Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Assigned Agent Dropdown */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700">
            Assigned Agent
          </label>
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            disabled={isLoadingAgents}
            className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
          >
            <option value="">All Agents</option>
            {assignedAgents.map((agent) => (
              <option key={agent.user_id} value={agent.user_id}>
                {agent.user_name}
              </option>
            ))}
          </select>
          {isLoadingAgents && (
            <p className="text-xs text-gray-500 mt-1 animate-pulse">
              Loading agents...
            </p>
          )}
        </div>
      </div>

      {/* Clear Filters Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onClearFilters}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};

export default QATrackerReportFilters;
