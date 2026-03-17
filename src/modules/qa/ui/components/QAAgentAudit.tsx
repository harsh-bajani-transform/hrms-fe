import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../../../context/AuthContext";
import * as XLSX from "xlsx";
import {
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Award,
  Search,
  Users,
  FileText,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loading from "@/components/common/Loading";
import api, { qcApi } from "../../../../services/api";
import { AuditRecord, GroupedQAAgent } from "../../types";
import ErrorListModal from "./ErrorListModal";
import AddQCScoreModal from "./AddQCScoreModal";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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
  const [reportData, setReportData] = useState<AuditRecord[]>([]);

  // Modal states
  const [selectedErrors, setSelectedErrors] = useState<string[]>([]);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [selectedQAForScore, setSelectedQAForScore] = useState<{
    id: string | number;
    name: string;
  } | null>(null);

  const getQCScoreColorClass = (score: number | string | null | undefined) => {
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

  const formatDateTime = (dateTimeString: string | undefined) => {
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

  const groupedByQAAgent = useMemo(() => {
    const grouped: Record<string, GroupedQAAgent> = {};
    auditData.forEach((record) => {
      const qaName = record.qa_agent_name || "Unknown QA Agent";
      if (!grouped[qaName]) {
        grouped[qaName] = {
          qaAgentName: qaName,
          qaAgentId: record.qa_agent_id ?? qaName,
          records: [],
          totalQCs: 0,
          totalErrors: 0,
          avgScore: 0,
        };
      }

      const group = grouped[qaName]!;
      group.records.push(record);
      group.totalQCs += Number(record.total_qc_performed) || 0;
      group.totalErrors += Number(record.total_errors_found) || 0;
    });

    Object.values(grouped).forEach((group) => {
      const g = group as GroupedQAAgent;
      if (g.records.length > 0) {
        const totalScore = g.records.reduce(
          (sum, r) => sum + (Number(r.average_qc_score) || 0),
          0,
        );
        g.avgScore = Number((totalScore / g.records.length).toFixed(2));
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
      const response = await qcApi.get("/qc-records/list", {
        params: {
          logged_in_user_id: user?.user_id ?? user?.id,
          month_year: monthFilter,
        },
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

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/qc_audit/report", {
        logged_in_user_id: user?.user_id ?? user?.id,
      });
      const records = response.data?.data?.records || [];
      const mappedData = records.map((record: any) => ({
        agent_name: record.agent_name,
        audit_datetime: record.audit_datetime,
        project_name: record.project,
        task_name: record.task,
        total_qc_performed: record.total_qcs,
        average_qc_score: record.avg_qc_score,
        total_errors_found: record.total_errors,
        qc_checked_file: record.qc_checked_file,
        status: record.status,
        error_notes: record.error_notes,
      }));
      setReportData(mappedData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Error fetching report data:", message);
      setError("Failed to load report data");
    } finally {
      setLoading(false);
    }
  }, [user?.user_id, user?.id]);

  useEffect(() => {
    if (user?.user_id || user?.id) {
      if (activeTab === "audit_form") {
        fetchAuditData();
      } else {
        fetchReportData();
      }
    }
  }, [fetchAuditData, fetchReportData, activeTab, user?.user_id, user?.id]);

  const toggleAgent = (qaName: string) => {
    setExpandedAgents((prev) => ({ ...prev, [qaName]: !prev[qaName] }));
  };

  const handleExportExcel = () => {
    const dataToExport = activeTab === "audit_form" ? auditData : reportData;
    if (dataToExport.length === 0) {
      toast.error("No data to export");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AuditData");
    XLSX.writeFile(wb, "QA_Agent_Audit.xlsx");
    toast.success("Data exported successfully");
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
              <span>Audit Form</span>
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
              <FileSpreadsheet className="w-4 h-4" />
              <span>Audit Report</span>
            </div>
            {activeTab === "audit_report" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
            )}
          </button>
        </div>

        <div className="p-6 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 ml-1">
              <Search className="w-3.5 h-3.5" />
              Search Within Lists
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by agent name, project, task..."
                className="pl-10 h-11 bg-white border-slate-200 rounded-xl focus:ring-blue-500"
              />
            </div>
          </div>
          {activeTab === "audit_form" && (
            <div className="w-full md:w-48 space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 ml-1">
                Month Filter
              </label>
              <Input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-xl"
              />
            </div>
          )}
          <Button
            variant="outline"
            className="h-11 px-6 border-slate-200 hover:bg-white hover:text-blue-600 font-bold rounded-xl flex items-center gap-2"
            onClick={handleExportExcel}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export
          </Button>
        </div>
      </div>

      {loading && (
        <div className="py-20 flex justify-center">
          <Loading />
        </div>
      )}

      {error && (
        <div className="p-8">
          <ErrorMessage message={error} />
        </div>
      )}

      {activeTab === "audit_form" && !loading && (
        <div className="space-y-4">
          {filteredQAAgents.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-slate-200" />
              <p className="text-slate-500 font-medium">
                No audit records found.
              </p>
            </div>
          ) : (
            filteredQAAgents.map((qa) => (
              <div
                key={qa.qaAgentName}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div
                  className="px-6 py-4 bg-slate-50/50 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleAgent(qa.qaAgentName)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">
                        {qa.qaAgentName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {qa.records.length} records • Total QCs: {qa.totalQCs}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Avg Score
                      </p>
                      <p
                        className={cn(
                          "text-lg font-black",
                          getQCScoreColorClass(qa.avgScore),
                        )}
                      >
                        {qa.avgScore}%
                      </p>
                    </div>
                    {expandedAgents[qa.qaAgentName] ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {expandedAgents[qa.qaAgentName] && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/30 border-b border-slate-100">
                          <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">
                            DateTime
                          </th>
                          <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">
                            Agent
                          </th>
                          <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">
                            Project
                          </th>
                          <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">
                            QCs
                          </th>
                          <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">
                            Score
                          </th>
                          <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase text-center">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {qa.records.map((record) => {
                          const { date, time } = formatDateTime(
                            record.audit_datetime,
                          );
                          return (
                            <tr
                              key={record.audit_id}
                              className="hover:bg-slate-50/30 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <p className="text-sm font-bold text-slate-700">
                                  {date}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {time}
                                </p>
                              </td>
                              <td className="px-6 py-4 font-bold text-sm text-slate-800">
                                {record.agent_name}
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-medium text-slate-700">
                                  {record.project_name}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate max-w-[150px]">
                                  {record.task_name}
                                </p>
                              </td>
                              <td className="px-6 py-4 font-bold text-sm text-slate-600">
                                {record.total_qc_performed}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={cn(
                                    "px-2 py-1 rounded text-xs font-bold",
                                    getQCScoreColorClass(
                                      record.average_qc_score,
                                    ),
                                  )}
                                >
                                  {record.average_qc_score != null
                                    ? `${record.average_qc_score}%`
                                    : "—"}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                                    onClick={() => {
                                      setSelectedErrors(
                                        record.error_list || [],
                                      );
                                      setIsErrorModalOpen(true);
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border-none"
                                    onClick={() => {
                                      setSelectedQAForScore({
                                        id: (
                                          record.audit_id ||
                                          record.id ||
                                          ""
                                        ).toString(),
                                        name: record.qa_agent_name || "Unknown",
                                      });
                                      setIsScoreModalOpen(true);
                                    }}
                                  >
                                    <Award className="w-3.5 h-3.5 mr-1" />
                                    Add Score
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "audit_report" && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">
                    Audit Date & Time
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">
                    Agent Name
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">
                    Project
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">
                    Task
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase text-center whitespace-nowrap">
                    Total QCs
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase text-center whitespace-nowrap">
                    QC Score
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase text-center whitespace-nowrap">
                    QC Checked File
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase text-center whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">
                    Error Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData
                  .filter(
                    (r) =>
                      (r.agent_name || "")
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      (r.project_name || "")
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()),
                  )
                  .map((record, idx) => {
                    const { date, time } = formatDateTime(record.audit_datetime);
                    return (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-700">{date}</p>
                          <p className="text-[10px] text-slate-400">{time}</p>
                        </td>
                        <td className="px-6 py-4 font-bold text-blue-600">
                          {record.agent_name || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {record.project_name || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          {record.task_name || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-600">
                          {record.total_qc_performed || 0}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={cn(
                              "px-2 py-1 rounded text-xs font-bold",
                              getQCScoreColorClass(
                                record.average_qc_score,
                              ),
                            )}
                          >
                            {record.average_qc_score != null
                              ? `${Number(record.average_qc_score).toFixed(2)}%`
                              : "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {record.qc_checked_file ? (
                            <a
                              href={record.qc_checked_file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Download QC Checked File"
                            >
                              <FileSpreadsheet className="w-5 h-5 mx-auto" />
                            </a>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge className="bg-blue-50 text-blue-700 border-none font-bold uppercase text-[10px]">
                            {record.status || "Completed"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-xs max-w-[200px] truncate">
                          {record.error_notes || record.notes || "—"}
                        </td>
                      </tr>
                    );
                  })}
                {reportData.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-12 text-center text-slate-400 italic"
                    >
                      No report data found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ErrorListModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        errors={selectedErrors}
      />

      <AddQCScoreModal
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        qaAgentId={selectedQAForScore?.id || ""}
        qaAgentName={selectedQAForScore?.name || ""}
        month={monthFilter}
        onSuccess={() => {
          setIsScoreModalOpen(false);
          fetchAuditData();
        }}
      />
    </div>
  );
};

export default QAAgentAudit;
