import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../../../context/AuthContext";
import {
  Award,
  Search,
  Users,
  FileCheck,
  Calendar,
  UserCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loading from "@/components/common/Loading";
import { qcApi } from "../../../../services/api";
import type { AuditRecord, GroupedQAAgent } from "../../types";
import ErrorListModal from "./ErrorListModal";
import AddQCScoreModal from "./AddQCScoreModal";
import { DataTable } from "@/components/ui/data-table";
import { createAuditFormColumns } from "./AuditFormColumns";
import MultiSelectWithCheckbox from "@/components/common/MultiSelectWithCheckbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface AgentFilterState {
  agents: string[];
  startDate: string;
  endDate: string;
}

const AuditFormTab: React.FC = () => {
  const { user } = useAuth();
  const [auditData, setAuditData] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Per-agent filters
  const [agentFilters, setAgentFilters] = useState<
    Record<string, AgentFilterState>
  >({});

  // Modal states
  const [selectedErrors, setSelectedErrors] = useState<any[]>([]);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [selectedRecordForScore, setSelectedRecordForScore] =
    useState<AuditRecord | null>(null);

  // Column definitions with callbacks
  const columns = useMemo(
    () =>
      createAuditFormColumns({
        onViewErrors: (errorList: any[]) => {
          setSelectedErrors(errorList);
          setIsErrorModalOpen(true);
        },
        onAddScore: (record: AuditRecord) => {
          setSelectedRecordForScore(record);
          setIsScoreModalOpen(true);
        },
      }),
    [],
  );

  // Group data by QA Agent
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
      group.totalErrors += Array.isArray(record.error_list)
        ? record.error_list.length
        : 0;
    });

    Object.values(grouped).forEach((group) => {
      const g = group as GroupedQAAgent;
      if (g.records.length > 0) {
        const totalScore = g.records.reduce(
          (sum, r) =>
            sum + (Number(r.qc_score) || Number(r.average_qc_score) || 0),
          0,
        );
        g.avgScore = Number((totalScore / g.records.length).toFixed(2));
      }
    });

    return Object.values(grouped);
  }, [auditData]);

  // Filter grouped data by search
  const filteredQAAgents = useMemo(() => {
    if (!searchQuery.trim()) return groupedByQAAgent;
    const query = searchQuery.toLowerCase();
    return groupedByQAAgent.filter(
      (qa) =>
        qa.qaAgentName.toLowerCase().includes(query) ||
        qa.records.some(
          (r: AuditRecord) =>
            (r.agent_name || "").toLowerCase().includes(query) ||
            (r.project_name || "").toLowerCase().includes(query) ||
            (r.task_name || "").toLowerCase().includes(query),
        ),
    );
  }, [groupedByQAAgent, searchQuery]);

  // Auto-expand all when data loads (optional, if we want to default open)
  const defaultExpandedValues = useMemo(() => {
    return filteredQAAgents.map((qa) => qa.qaAgentName);
  }, [filteredQAAgents]);

  // Per-agent filter helpers
  const getAgentFilter = (qaAgentName: string): AgentFilterState => {
    const existing = agentFilters[qaAgentName];
    if (existing) return existing;
    const defaultFilter: AgentFilterState = {
      agents: [],
      startDate: "", // Relaxed: No default start date
      endDate: "", // Relaxed: No default end date
    };
    return defaultFilter;
  };

  const updateAgentFilter = (
    qaAgentName: string,
    updates: Partial<AgentFilterState>,
  ) => {
    setAgentFilters((prev) => {
      const current = getAgentFilter(qaAgentName);
      return {
        ...prev,
        [qaAgentName]: {
          ...current,
          ...updates,
        },
      };
    });
  };

  const clearAgentFilters = (qaAgentName: string) => {
    setAgentFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[qaAgentName];
      return newFilters;
    });
  };

  const getFilteredRecords = (records: AuditRecord[], qaAgentName: string) => {
    const filter = getAgentFilter(qaAgentName);
    let filtered = [...records];

    if (filter.agents && filter.agents.length > 0) {
      filtered = filtered.filter((record) =>
        filter.agents.includes(record.agent_name || ""),
      );
    }

    if (filter.startDate) {
      const start = new Date(filter.startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter((record) => {
        const dateStr = record.audit_datetime || record.timestamp;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d >= start;
      });
    }

    if (filter.endDate) {
      const end = new Date(filter.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((record) => {
        const dateStr = record.audit_datetime || record.timestamp;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d <= end;
      });
    }

    return filtered;
  };

  const getUniqueAgents = (records: AuditRecord[]) => {
    const agents = [
      ...new Set(records.map((r) => r.agent_name).filter(Boolean)),
    ];
    return agents.map((agent) => ({ value: agent!, label: agent! }));
  };

  // Fetch data
  const fetchAuditData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("[AuditFormTab] Fetching QC records...");
      const response = await qcApi.get("/qc-records/list");
      console.log("[AuditFormTab] API Response:", response.data);
      const mappedData = (response.data?.data || []).map(
        (record: Record<string, unknown>) => ({
          audit_id: record.id,
          audit_datetime:
            (record.timestamp as string) ||
            (record.date_of_file_submission as string),
          timestamp: record.timestamp,
          qa_agent_name: record.qa_name,
          qa_agent_id: record.qc_user_id,
          agent_name: record.agent_name,
          project_name: record.project_name,
          task_name: record.task_name,
          file_name: (record["10%_file_path"] as string)
            ? (record["10%_file_path"] as string).split("/").pop()
            : (record.file_path as string)
              ? (record.file_path as string).split("/").pop()
              : "N/A",
          file_url:
            (record["10%_file_path"] as string) ||
            (record.file_path as string) ||
            "",
          total_qc_performed:
            (record["10%_data_generated_count"] as number) ||
            (record.file_record_count as number) ||
            0,
          "10%_data_generated_count":
            (record["10%_data_generated_count"] as number) || 0,
          file_record_count: (record.file_record_count as number) || 0,
          qc_score: (record.qc_score as number) ?? null,
          average_qc_score: (record.qc_score as number) ?? null,
          error_score: (record.error_score as number) ?? null,
          total_errors_found: (record.error_score as number) ?? null,
          status: (record.status as string) || "Pending",
          qc_checked_file: (record.qc_checked_file as string) || null,
          error_notes: (record.error_notes as string) || null,
          audit_performed: !!(record.qc_checked_file || record.error_notes),
          error_list: (() => {
            try {
              if (typeof record.error_list === "string")
                return JSON.parse(record.error_list);
              return Array.isArray(record.error_list) ? record.error_list : [];
            } catch {
              return [];
            }
          })(),
        }),
      );
      setAuditData(mappedData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Error fetching audit data:", message);
      setError("Failed to load audit data");
    } finally {
      setLoading(false);
    }
  }, []); // Removed user?.user_id, user?.id as they aren't used in the body

  useEffect(() => {
    if (user?.user_id || user?.id) {
      fetchAuditData();
    }
  }, [fetchAuditData, user?.user_id, user?.id]);

  return (
    <>
      {/* Search Filter */}
      <div className=" p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="flex-1 lg:flex-none lg:w-80">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase mb-2">
              <Search className="w-3.5 h-3.5 text-blue-600" />
              Search QA Agents
            </label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by QA agent name..."
              className="h-11 bg-slate-50 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>
      </div>

      {/* Grouped QA Agent Audit */}
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
        ) : filteredQAAgents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-blue-100 p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-400 font-medium text-lg">
              No QA agents found
            </p>
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
            {filteredQAAgents.map(({ qaAgentName, records }) => {
              const filteredRecords = getFilteredRecords(records, qaAgentName);
              const agentFilter = getAgentFilter(qaAgentName);
              const uniqueAgents = getUniqueAgents(records);

              const totalRecords = records.length;
              const totalQCs = records.reduce(
                (sum, r) =>
                  sum +
                  (Number(r["10%_data_generated_count"]) ||
                    Number(r.total_qc_performed) ||
                    0),
                0,
              );
              const avgScoreFloat =
                records.length > 0
                  ? records.reduce(
                      (sum, r) =>
                        sum +
                        (Number(r.qc_score) || Number(r.average_qc_score) || 0),
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
                          <div>
                            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase mb-2">
                              <Users className="w-3.5 h-3.5 text-blue-600" />
                              Filter by Agent Name
                            </label>
                            <MultiSelectWithCheckbox
                              value={agentFilter.agents}
                              onChange={(value) =>
                                updateAgentFilter(qaAgentName, {
                                  agents: value as string[],
                                })
                              }
                              options={uniqueAgents}
                              placeholder="All Agents"
                            />
                          </div>
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
                                className="h-10 bg-white border-slate-200 rounded-lg"
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
                                className="h-10 bg-white border-slate-200 rounded-lg"
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
                        {(agentFilter.agents.length > 0 ||
                          agentFilter.startDate ||
                          agentFilter.endDate) && (
                          <div className="mt-4 flex items-center gap-2 text-xs">
                            <span className="font-bold text-slate-700">
                              Active Filters:
                            </span>
                            {agentFilter.agents.length > 0 && (
                              <span className="px-3 py-1.5 bg-blue-600 text-white rounded-full font-bold shadow-sm">
                                Agents: {agentFilter.agents.length}
                              </span>
                            )}
                            {(agentFilter.startDate || agentFilter.endDate) && (
                              <span className="px-3 py-1.5 bg-purple-600 text-white rounded-full font-bold shadow-sm">
                                Date Range Applied
                              </span>
                            )}
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

      {/* Modals */}
      <ErrorListModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        errors={selectedErrors}
      />
      <AddQCScoreModal
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        selectedRecord={selectedRecordForScore}
        onSuccess={() => {
          setIsScoreModalOpen(false);
          fetchAuditData();
        }}
      />
    </>
  );
};

export default AuditFormTab;
