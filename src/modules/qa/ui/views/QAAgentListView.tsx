import React, { useState } from "react";
import {
  RotateCcw,
  FileCheck,
  Users as UsersIcon,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import type { TrackerRow } from "../../../dashboard/types";
import QCFormReportView from "./QCFormReportView";
import AgentReworkReportView from "./AgentReworkReportView";
import AgentFileReportView from "./AgentFileReportView";

type AgentListSubTab = "agent-file-report" | "qc-form-report" | "rework-report";

const QAAgentListView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] =
    useState<AgentListSubTab>("agent-file-report");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleQCForm = (tracker: TrackerRow) => {
    console.log(
      "[QAAgentListView] Opening QC Form for tracker:",
      tracker.tracker_id,
    );
    toast.success("QC Form functionality coming soon!");
  };

  return (
    <div className="space-y-6 mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-50 rounded-lg shadow-sm">
          <UsersIcon className="w-7 h-7 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Agent Files & QC Report
          </h2>
          <p className="text-slate-600 font-medium">
            View and manage agent files with professional QC evaluations
          </p>
        </div>
      </div>

      {/* Internal Tabs */}
      <div className="bg-white rounded shadow-sm border border-gray-200 p-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setActiveSubTab("agent-file-report")}
            className={`flex-1 px-5 py-3 text-sm font-medium transition-all duration-200 rounded-lg flex items-center justify-center gap-2 ${
              activeSubTab === "agent-file-report"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:shadow-sm"
            }`}
          >
            <FileText className="w-4 h-4" />
            Agent's File Report
          </button>
          <button
            onClick={() => setActiveSubTab("qc-form-report")}
            className={`flex-1 px-5 py-3 text-sm font-medium transition-all duration-200 rounded-lg flex items-center justify-center gap-2 ${
              activeSubTab === "qc-form-report"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:shadow-sm"
            }`}
          >
            <FileCheck className="w-4 h-4" />
            QC Form Report
          </button>
          <button
            onClick={() => setActiveSubTab("rework-report")}
            className={`flex-1 px-5 py-3 text-sm font-medium transition-all duration-200 rounded-lg flex items-center justify-center gap-2 ${
              activeSubTab === "rework-report"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:shadow-sm"
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Agent's Rework & Correction File Report
          </button>
        </div>
      </div>

      {activeSubTab === "agent-file-report" ? (
        <AgentFileReportView
          handleQCForm={handleQCForm}
          refreshTrigger={refreshTrigger}
        />
      ) : activeSubTab === "qc-form-report" ? (
        <QCFormReportView />
      ) : (
        <AgentReworkReportView />
      )}
    </div>
  );
};

export default QAAgentListView;
