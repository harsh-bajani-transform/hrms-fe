import React, { useState } from "react";
import { Users, FileText, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import AuditFormTab from "./AuditFormTab";
import AuditReportTab from "./AuditReportTab";

const QAAgentAudit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"audit_form" | "audit_report">(
    "audit_form",
  );

  return (
    <div className="space-y-6 mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Section */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-50 rounded-lg shadow-sm">
          <Users className="w-7 h-7 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            QA Agent Audit
          </h2>
          <p className="text-slate-600 font-medium">
            Monitor and review QA Agent performance and quality checking
            activities
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("audit_form")}
            className={cn(
              "flex-1 px-6 py-4 text-sm font-bold transition-all relative",
              activeTab === "audit_form"
                ? "text-blue-600 bg-blue-50"
                : "text-slate-600 hover:text-slate-800 hover:bg-slate-50",
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              <span>QA Agent Audit Form</span>
            </div>
            {activeTab === "audit_form" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("audit_report")}
            className={cn(
              "flex-1 px-6 py-4 text-sm font-bold transition-all relative",
              activeTab === "audit_report"
                ? "text-blue-600 bg-blue-50"
                : "text-slate-600 hover:text-slate-800 hover:bg-slate-50",
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <FileCheck className="w-4 h-4" />
              <span>QA Agent Audit Report</span>
            </div>
            {activeTab === "audit_report" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="transition-all duration-300">
        {activeTab === "audit_form" ? <AuditFormTab /> : <AuditReportTab />}
      </div>
    </div>
  );
};

export default QAAgentAudit;
