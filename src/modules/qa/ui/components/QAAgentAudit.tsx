import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../../../context/AuthContext";
import * as XLSX from "xlsx";
import {
  FileSpreadsheet,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Award,
  Search,
  Users,
  FileText,
  FileCheck,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loading from "@/components/common/Loading";
import { qcApi } from "../../../../services/api";
import { AuditRecord, GroupedQAAgent } from "../../types";

// Helper function to get current month in YYYY-MM format
const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const QAAgentAudit: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"audit_form" | "audit_report">(
    "audit_form",
  );
  const [monthFilter, setMonthFilter] = useState(getCurrentMonth());
  const [auditData, setAuditData] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedAgents, setExpandedAgents] = useState<Record<string, boolean>>(
    {},
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Helper functions
  const getQCScoreColorClass = (score: number | string | null) => {
    if (
      score === null ||
      score === undefined ||
      score === "-" ||
      isNaN(Number(score))
    )
      return "text-slate-700";
    const numScore = Number(score);
    if (numScore >= 95) return "text-green-800 bg-green-100 font-bold";
    if (numScore >= 80) return "text-yellow-700 bg-yellow-100 font-bold";
    return "text-red-700 bg-red-200 font-bold";
  };

  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString || dateTimeString === "-")
      return { date: "-", time: "-" };
    try {
      const date = new Date(dateTimeString);
      const day = date.getDate();
      const month = date.toLocaleString("en-US", { month: "short" });
      const year = date.getFullYear();
      return {
        date: `${day}/${month}/${year}`,
        time: date.toLocaleString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      };
    } catch {
      return { date: "-", time: "-" };
    }
  };

  // Group data by QA Agent
  const groupedByQAAgent = useMemo(() => {
    const grouped: Record<string, GroupedQAAgent> = {};
    auditData.forEach((record) => {
      const qaName = record.qa_agent_name || "Unknown QA Agent";
      if (!grouped[qaName]) {
        grouped[qaName] = {
          qaAgentName: qaName,
          qaAgentId: record.qa_agent_id || qaName,
          records: [],
          totalQCs: 0,
          totalErrors: 0,
          avgScore: 0,
        };
      }
      grouped[qaName]?.records.push(record);
    });

    Object.keys(grouped).forEach((name) => {
      const g = grouped[name];
      if (g) {
        const records = g.records;
        const totalScore = records.reduce(
          (sum: number, r: AuditRecord) =>
            sum + (Number(r.qc_score || r.average_qc_score) || 0),
          0,
        );
        g.avgScore =
          records.length > 0 ? (totalScore / records.length).toFixed(2) : 0;
        g.totalQCs = records.reduce(
          (sum: number, r: AuditRecord) =>
            sum +
            (Number(r.total_qc_performed || r["10%_data_generated_count"]) ||
              0),
          0,
        );
        g.totalErrors = records.reduce(
          (sum: number, r: AuditRecord) =>
            sum + (Number(r.total_errors_found || r.error_score) || 0),
          0,
        );
      }
    });

    return Object.values(grouped);
  }, [auditData]);

  const filteredQAAgents = useMemo(() => {
    if (!searchQuery.trim()) return groupedByQAAgent;
    const query = searchQuery.toLowerCase();
    return groupedByQAAgent.filter(
      (qa) =>
        qa.qaAgentName.toLowerCase().includes(query) ||
        qa.records.some(
          (r: AuditRecord) =>
            (r.agent_name || "").toLowerCase().includes(query) ||
            (r.project_name || "").toLowerCase().includes(query),
        ),
    );
  }, [groupedByQAAgent, searchQuery]);

  const fetchAuditData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await qcApi.post("/qa-agent-audit/list", {
        logged_in_user_id: user?.user_id ?? user?.id,
        month_year: monthFilter,
      });
      setAuditData(response.data?.data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Error fetching audit data:", message);
      setError("Failed to load audit data");
    } finally {
      setLoading(false);
    }
  }, [user?.user_id, user?.id, monthFilter]);

  useEffect(() => {
    if (user?.user_id || user?.id) fetchAuditData();
  }, [fetchAuditData, user?.user_id, user?.id]);

  const toggleAgent = (qaName: string) => {
    setExpandedAgents((prev) => ({ ...prev, [qaName]: !prev[qaName] }));
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("audit_form")}
            className={cn(
              "flex-1 px-6 py-4 text-sm font-bold transition-all relative",
              activeTab === "audit_form"
                ? "text-blue-600 bg-blue-50"
                : "text-slate-600 hover:bg-slate-50",
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
                : "text-slate-600 hover:bg-slate-50",
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

      {activeTab === "audit_form" && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-64 space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5" />
                Month
              </label>
              <Input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="bg-slate-50 border-slate-200"
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" />
                Search QA Agents
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by QA agent name..."
                  className="pl-10 bg-slate-50 border-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Grouped QA Agent Cards */}
          <div className="space-y-4">
            {loading ? (
              <div className="py-12 flex justify-center">
                <Loading />
              </div>
            ) : error ? (
              <ErrorMessage message={error} />
            ) : filteredQAAgents.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500 font-medium">No QA agents found</p>
              </div>
            ) : (
              filteredQAAgents.map((qa) => (
                <div
                  key={qa.qaAgentName}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                >
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-inner">
                        {qa.qaAgentName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-800">
                            {qa.qaAgentName}
                          </h3>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">
                            {qa.records.length} Records
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Award className="w-3.5 h-3.5" />
                            <span>
                              Total QCs:{" "}
                              <span className="font-bold text-slate-700">
                                {qa.totalQCs}
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>
                              Avg Score:{" "}
                              <span
                                className={cn(
                                  "font-bold",
                                  Number(qa.avgScore) >= 95
                                    ? "text-green-600"
                                    : "text-yellow-600",
                                )}
                              >
                                {qa.avgScore}%
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9"
                      >
                        <Plus className="w-4 h-4" />
                        Add Score
                      </Button>
                      <button
                        onClick={() => toggleAgent(qa.qaAgentName)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        {expandedAgents[qa.qaAgentName] ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {expandedAgents[qa.qaAgentName] && (
                    <div className="p-0 overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">
                              Date & Time
                            </th>
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">
                              Agent
                            </th>
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">
                              Project / Task
                            </th>
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">
                              Total QC
                            </th>
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">
                              QC Score
                            </th>
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">
                              Errors
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {qa.records.map(
                            (record: AuditRecord, idx: number) => {
                              const dt = formatDateTime(
                                record.audit_datetime || record.date_time || "",
                              );
                              return (
                                <tr
                                  key={idx}
                                  className="hover:bg-slate-50/50 transition-colors"
                                >
                                  <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-slate-800">
                                      {dt.date}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      {dt.time}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-blue-600">
                                      {record.agent_name || "N/A"}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-slate-700 truncate max-w-[200px]">
                                      {record.project_name || "N/A"}
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                                      {record.task_name || "N/A"}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 font-bold text-slate-700">
                                    {record.total_qc_performed ||
                                      record["10%_data_generated_count"] ||
                                      0}
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span
                                      className={cn(
                                        "px-2 py-1 rounded text-xs",
                                        getQCScoreColorClass(
                                          record.qc_score ||
                                            record.average_qc_score ||
                                            null,
                                        ),
                                      )}
                                    >
                                      {record.qc_score ||
                                        record.average_qc_score}
                                      %
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-center text-red-600 font-bold">
                                    {record.total_errors_found ||
                                      record.error_score ||
                                      0}
                                  </td>
                                </tr>
                              );
                            },
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "audit_report" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-800">
            QA Agent Audit Reports
          </h3>
          <p className="text-slate-500 max-w-md mx-auto mt-2">
            Historical audit reports and quality trends for QA team members.
            Functional migration in progress.
          </p>
        </div>
      )}
    </div>
  );
};

export default QAAgentAudit;
