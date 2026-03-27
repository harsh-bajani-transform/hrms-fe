import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../../../context/AuthContext";
import {
  Award,
  Search,
  Users,
  FileCheck,
  Calendar,
  UserCheck,
  FileSpreadsheet,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loading from "@/components/common/Loading";
import api from "../../../../services/api";
import type { AuditRecord, GroupedQAAgent } from "../../types";
import { DataTable } from "@/components/ui/data-table";
import { createAuditReportColumns } from "./AuditReportColumns";
import { exportToCSV } from "../../../../lib/utils/exportUtils";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface AgentReportFilterState {
  agents: string[];
  startDate: string;
  endDate: string;
}

const AuditReportTab: React.FC = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Per-agent filters
  const [agentFilters, setAgentFilters] = useState<
    Record<string, AgentReportFilterState>
  >({});

  // Column definitions
  const columns = useMemo(() => createAuditReportColumns(), []);

  // Group data by Agent (as per old frontend report tab)
  const groupedByAgent = useMemo(() => {
    const grouped: Record<string, GroupedQAAgent> = {};
    reportData.forEach((record) => {
      const agentName = record.agent_name || "Unknown Agent";
      if (!grouped[agentName]) {
        grouped[agentName] = {
          qaAgentName: agentName, // We reuse the interface property name for consistency
          qaAgentId: agentName,
          records: [],
          totalQCs: 0,
          totalErrors: 0,
          avgScore: 0,
        };
      }
      const group = grouped[agentName]!;
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
  }, [reportData]);

  // Filter grouped data by search
  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return groupedByAgent;
    const query = searchQuery.toLowerCase();
    return groupedByAgent.filter(
      (agent) =>
        agent.qaAgentName.toLowerCase().includes(query) ||
        agent.records.some(
          (r: AuditRecord) =>
            (r.project_name || "").toLowerCase().includes(query) ||
            (r.task_name || "").toLowerCase().includes(query),
        ),
    );
  }, [groupedByAgent, searchQuery]);

  // Auto-expand all when data loads (optional)
  const defaultExpandedValues = useMemo(() => {
    return filteredAgents.map((agent) => agent.qaAgentName);
  }, [filteredAgents]);

  // Per-agent filter helpers
  const getAgentFilter = (agentName: string): AgentReportFilterState => {
    const existing = agentFilters[agentName];
    if (existing) return existing;
    const defaultFilter: AgentReportFilterState = {
      agents: [],
      startDate: "", // Relaxed: No default start date
      endDate: "", // Relaxed: No default end date
    };
    return defaultFilter;
  };

  const updateAgentFilter = (
    agentName: string,
    updates: Partial<AgentReportFilterState>,
  ) => {
    setAgentFilters((prev) => {
      const current = getAgentFilter(agentName);
      return {
        ...prev,
        [agentName]: {
          ...current,
          ...updates,
        },
      };
    });
  };

  const clearAgentFilters = (agentName: string) => {
    setAgentFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[agentName];
      return newFilters;
    });
  };

  const getFilteredRecords = (records: AuditRecord[], agentName: string) => {
    const filter = getAgentFilter(agentName);
    let filtered = [...records];

    if (filter.startDate) {
      const start = new Date(filter.startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter((record) => {
        const dateStr = record.audit_datetime || record.timestamp;
        if (!dateStr) return false;
        const d = new Date(dateStr as string);
        return d >= start;
      });
    }

    if (filter.endDate) {
      const end = new Date(filter.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((record) => {
        const dateStr = record.audit_datetime || record.timestamp;
        if (!dateStr) return false;
        const d = new Date(dateStr as string);
        return d <= end;
      });
    }

    return filtered;
  };

  // Fetch data from Python backend
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("[AuditReportTab] Fetching report data...");
      const response = await api.post("/qc_audit/report", {
        logged_in_user_id: user?.user_id ?? user?.id,
      });
      console.log("[AuditReportTab] API Response:", response.data);
      const records = response.data?.data?.records || [];
      const mappedData = records.map((record: Record<string, any>) => ({
        ...record,
        agent_name: record.agent_name as string,
        audit_datetime: record.audit_datetime as string,
        project_name: record.project as string,
        task_name: record.task as string,
        total_qc_performed: record.total_qcs as number,
        average_qc_score: record.avg_qc_score as number,
        total_errors_found: record.total_errors as number,
        qc_checked_file: record.qc_checked_file as string,
        status: record.status as string,
        error_notes: record.error_notes as string,
        notes: record.error_notes as string,
      }));
      setReportData(mappedData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Error fetching report data:", message);
      setError("Failed to load audit report data");
    } finally {
      setLoading(false);
    }
  }, [user?.user_id, user?.id]);

  useEffect(() => {
    if (user?.user_id || user?.id) {
      fetchReportData();
    }
  }, [fetchReportData, user?.user_id, user?.id]);

  const handleExportCSV = () => {
    if (reportData.length === 0) {
      toast.error("No data to export");
      return;
    }
    exportToCSV(reportData as unknown as Record<string, unknown>[], "QA_Agent_Audit_Report.csv");
  };

  return (
    <>
      {/* Search Filter & Export */}
      <div className="p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="flex-1 lg:flex-none lg:w-80">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase mb-2">
              <Search className="w-3.5 h-3.5 text-blue-600" />
              Search Agents
            </label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by agent name..."
              className="h-11 bg-slate-50 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="flex items-end ml-auto">
            <Button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 border-none"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Grouped Agent Audit Report */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl shadow-md border border-blue-100 py-12 text-center">
            <Loading
              title="Loading QA Agent Audit data..."
              fullHeight={false}
            />
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-md border border-blue-100 p-6">
            <ErrorMessage message={error} />
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-blue-100 p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-400 font-medium text-lg">No agents found</p>
            <p className="text-gray-400 text-sm mt-2">
              {searchQuery
                ? "Try adjusting your search query"
                : "No audit data available for this period"}
            </p>
          </div>
        ) : (
          <Accordion
            type="multiple"
            className="space-y-4"
            defaultValue={defaultExpandedValues}
          >
            {filteredAgents.map(({ qaAgentName, records }) => {
              const filteredRecords = getFilteredRecords(records, qaAgentName);
              const agentFilter = getAgentFilter(qaAgentName);

              const totalRecords = records.length;
              const totalQCs = records.reduce(
                (sum, r) => sum + (Number(r.total_qc_performed) || 0),
                0,
              );
              const avgScoreFloat =
                records.length > 0
                  ? records.reduce(
                      (sum, r) => sum + (Number(r.average_qc_score) || 0),
                      0,
                    ) / records.length
                  : 0;

              return (
                <AccordionItem
                  key={qaAgentName}
                  value={qaAgentName}
                  className="bg-white rounded-xl shadow-lg border-2 border-blue-100 overflow-hidden hover:shadow-xl transition-all duration-300 border-none"
                >
                  <AccordionTrigger className="hover:no-underline border-b-2 border-gray-200 p-6 data-[state=open]:bg-blue-50/10">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="bg-blue-600 text-white w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl shadow-md border-2 border-blue-200">
                        {qaAgentName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                            {qaAgentName}
                          </h3>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-md">
                            <FileCheck className="w-3.5 h-3.5" />
                            {totalRecords}{" "}
                            {totalRecords === 1 ? "Record" : "Records"}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 mt-3">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Award className="w-4 h-4 text-blue-700" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 font-semibold uppercase">
                                Total QC Records
                              </p>
                              <p className="text-lg font-bold text-blue-700">
                                {totalQCs}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "p-2 rounded-lg",
                                avgScoreFloat >= 95
                                  ? "bg-green-100"
                                  : avgScoreFloat >= 80
                                    ? "bg-yellow-100"
                                    : "bg-red-100",
                              )}
                            >
                              <UserCheck
                                className={cn(
                                  "w-4 h-4",
                                  avgScoreFloat >= 95
                                    ? "text-green-700"
                                    : avgScoreFloat >= 80
                                      ? "text-yellow-700"
                                      : "text-red-700",
                                )}
                              />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 font-semibold uppercase">
                                Avg Score
                              </p>
                              <p
                                className={cn(
                                  "text-lg font-bold",
                                  avgScoreFloat >= 95
                                    ? "text-green-700"
                                    : avgScoreFloat >= 80
                                      ? "text-yellow-700"
                                      : "text-red-700",
                                )}
                              >
                                {avgScoreFloat.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="p-0">
                    <div className="p-6">
                      {/* Per-agent Filters */}
                      <div className="mt-0 pt-0">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <div className="lg:col-span-2">
                            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase mb-2">
                              <Calendar className="w-3.5 h-3.5 text-blue-600" />
                              Date Range
                            </label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="date"
                                value={agentFilter.startDate}
                                onChange={(e) =>
                                  updateAgentFilter(qaAgentName, {
                                    startDate: e.target.value,
                                  })
                                }
                                className="h-10 bg-white border-slate-200 rounded-lg w-full sm:w-auto"
                              />
                              <span className="text-slate-400 font-bold">
                                to
                              </span>
                              <Input
                                type="date"
                                value={agentFilter.endDate}
                                onChange={(e) =>
                                  updateAgentFilter(qaAgentName, {
                                    endDate: e.target.value,
                                  })
                                }
                                className="h-10 bg-white border-slate-200 rounded-lg w-full sm:w-auto"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs font-bold text-slate-500 hover:text-red-600"
                                onClick={() => clearAgentFilters(qaAgentName)}
                              >
                                Clear
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Filter summary */}
                        {(agentFilter.startDate || agentFilter.endDate) && (
                          <div className="mt-4 flex items-center gap-2 text-xs">
                            <span className="font-bold text-slate-700">
                              Active Filters:
                            </span>
                            <span className="px-3 py-1.5 bg-purple-600 text-white rounded-full font-bold shadow-sm">
                              Date Range Applied
                            </span>
                            <span className="font-bold text-slate-700 ml-2">
                              Showing{" "}
                              <span className="text-blue-700">
                                {filteredRecords.length}
                              </span>{" "}
                              of{" "}
                              <span className="text-slate-500">
                                {records.length}
                              </span>{" "}
                              records
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 border-t pt-6">
                        <DataTable
                          columns={columns}
                          data={filteredRecords}
                          loading={false}
                          emptyMessage="No records match the applied filters."
                          emptyIcon={Users}
                          showPagination={true}
                          pageSize={10}
                          containerClassName=""
                          rowHoverClassName="hover:bg-blue-50/50"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </>
  );
};

export default AuditReportTab;
