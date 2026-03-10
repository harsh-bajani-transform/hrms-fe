import React, { useState, useCallback } from "react";
import { Users as UsersIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, FileCheck } from "lucide-react";
import AgentFileReportView from "./AgentFileReportView";
import QCFormReportView from "./QCFormReportView";
import DailyEntryFormModal from "../../../../components/common/DailyEntryFormModal";
import type { TrackerRow as Tracker } from "../../types";
import { log } from "../../../../config/environment";

const QAAgentList: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState<Tracker | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleQCForm = useCallback((tracker: Tracker) => {
    log("[QAAgentList] Opening QC Form for tracker:", tracker.tracker_id);
    setSelectedTracker(tracker);
    setIsModalOpen(true);
  }, []);

  return (
    <div className="space-y-6 mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
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

      <Tabs defaultValue="agent_files" className="w-full h-full">
        <TabsList className="bg-slate-100 py-6 px-2 rounded-lg border border-slate-200 mb-8 inline-flex h-14">
          <TabsTrigger
            value="agent_files"
            className="rounded-md px-6 py-5 h-full font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-base"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5" />
              <span>Agent's File Report</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="qc_report"
            className="rounded-md px-6 py-5 h-full font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-base"
          >
            <div className="flex items-center gap-2.5">
              <FileCheck className="w-5 h-5" />
              <span>QC Form Report</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="agent_files"
          className="mt-0 ring-offset-transparent focus-visible:ring-0"
        >
          <AgentFileReportView
            handleQCForm={handleQCForm}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>

        <TabsContent
          value="qc_report"
          className="mt-0 ring-offset-transparent focus-visible:ring-0"
        >
          <QCFormReportView />
        </TabsContent>
      </Tabs>

      {/* QC Form Modal */}
      {selectedTracker && (
        <DailyEntryFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTracker(null);
          }}
          onSubmit={() => {
            setRefreshTrigger((prev) => prev + 1);
          }}
          isEditMode={
            !!(selectedTracker?.qc_score || selectedTracker?.assigned_hours)
          }
          initialData={{
            ...(selectedTracker?.qc_score !== undefined &&
              selectedTracker?.qc_score !== null && {
                qcScore: selectedTracker.qc_score as string | number,
              }),
            ...(selectedTracker?.assigned_hours !== undefined &&
              selectedTracker?.assigned_hours !== null && {
                assignHours: selectedTracker.assigned_hours as string | number,
              }),
          }}
          user={{
            user_id: (selectedTracker?.user_id as string | number) || "",
            user_name: selectedTracker?.user_name || "",
          }}
          userId={(selectedTracker?.user_id as string | number) || ""}
          date={
            selectedTracker?.date_time
              ? selectedTracker.date_time.slice(0, 10)
              : null
          }
        />
      )}
    </div>
  );
};

export default QAAgentList;
