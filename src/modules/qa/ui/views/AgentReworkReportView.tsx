import React, { useState, useMemo, useEffect } from "react";
import {
  Users as UsersIcon,
  Search,
  RotateCcw,
  Calendar,
  FileCheck,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { reworkReportColumns, ReworkTracker } from "./AgentReworkReportColumns";
import api from "../../../../services/api";
import { useAuth } from "../../../../context/AuthContext";
import { log, logError } from "../../../../config/environment";
import { toast } from "sonner";
import { UserRef as Agent } from "../../../dashboard/types";

const AgentReworkReportView: React.FC = () => {
  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0] || "";
  };

  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<
    string | number | null
  >(null);
  const [agentSearchQuery, setAgentSearchQuery] = useState("");
  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState(getTodayDate());
  const [allReworkRecords, setAllReworkRecords] = useState<ReworkTracker[]>([]);

  useEffect(() => {
    const fetchReworkData = async () => {
      try {
        setLoading(true);
        log("[AgentReworkReportView] Fetching rework trackers");
        const response = await api.post("/qc_rework/view_rework_trackers", {});
        const records: ReworkTracker[] = response.data?.data?.records || [];
        setAllReworkRecords(records);

        // Extract unique agents from records
        const agentsMap: { [name: string]: Agent } = {};
        records.forEach((record) => {
          if (record.agent_name && !agentsMap[record.agent_name]) {
            agentsMap[record.agent_name] = {
              user_id: record.agent_name, // Using name as ID for filtering since the API returns names
              user_name: record.agent_name,
            };
          }
        });
        const uniqueAgents = Object.values(agentsMap);
        setAgents(uniqueAgents);

        if (uniqueAgents.length > 0 && !selectedAgentId) {
          setSelectedAgentId(uniqueAgents[0]?.user_name || null);
        }
      } catch (err) {
        logError("[AgentReworkReportView] Error fetching rework data:", err);
        toast.error("Failed to load rework report data");
      } finally {
        setLoading(false);
      }
    };

    if (user?.user_id) {
      fetchReworkData();
    }
  }, [user?.user_id, selectedAgentId]);

  const filteredAgentsForSidebar = useMemo(() => {
    return agents.filter((a) =>
      a.user_name?.toLowerCase().includes(agentSearchQuery.toLowerCase()),
    );
  }, [agents, agentSearchQuery]);

  const selectedAgent = useMemo(() => {
    return (
      agents.find((a) => String(a.user_name) === String(selectedAgentId)) || null
    );
  }, [agents, selectedAgentId]);

  const filteredRecords = useMemo(() => {
    if (!selectedAgentId) return [];
    
    return allReworkRecords.filter((record) => {
      const isCorrectAgent = String(record.agent_name) === String(selectedAgentId);
      if (!isCorrectAgent) return false;

      if (!record.worked_datetime) return true; // Show if no date for filtering

      try {
        const d = new Date(record.worked_datetime);
        const isoStr = d.toISOString().split("T")[0] || "";
        return isoStr >= startDate && isoStr <= endDate;
      } catch {
        return true;
      }
    });
  }, [allReworkRecords, selectedAgentId, startDate, endDate]);

  const handleResetToToday = () => {
    setStartDate(getTodayDate());
    setEndDate(getTodayDate());
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[750px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sidebar - Agent List */}
      <Card className="w-full lg:w-80 h-full border-none shadow-xl backdrop-blur-sm flex flex-col">
        <div className="p-6 space-y-6 bg-blue-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <UsersIcon className="w-5 h-5 opacity-80" />
              <span className="font-bold text-lg">Agents</span>
            </div>
            <Badge className="bg-white/20 text-white border-none font-bold">
              {agents.length}
            </Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
            <Input
              value={agentSearchQuery}
              onChange={(e) => setAgentSearchQuery(e.target.value)}
              placeholder="Search agents..."
              className="pl-10 h-11 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:ring-0 focus:border-white/40 rounded-xl"
            />
          </div>
        </div>
        <ScrollArea className="flex-1 p-3 bg-white overflow-auto">
          <div className="space-y-2">
            {loading ? (
              <div className="py-20 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-slate-500 text-sm mt-4">Loading report...</p>
              </div>
            ) : (
              filteredAgentsForSidebar.map((agent) => {
                const isSelected = String(agent.user_name) === String(selectedAgentId);
                return (
                  <div
                    key={agent.user_name}
                    onClick={() => setSelectedAgentId(agent.user_name || null)}
                    className={`
                    group flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200
                    ${
                      isSelected
                        ? "bg-white shadow-md border-l-4 border-blue-600 translate-x-1"
                        : "hover:bg-white hover:shadow-sm hover:translate-x-0.5"
                    }
                  `}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`
                      w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-colors
                      ${isSelected ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600 group-hover:bg-blue-200"}
                    `}
                      >
                        {agent.user_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="font-bold text-slate-800 text-sm truncate max-w-[150px]">
                        {agent.user_name}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Main Content Detail Area */}
      <div className="flex-1 h-full min-w-0">
        {selectedAgent ? (
          <Card className="h-full border-none shadow-xl bg-white overflow-hidden flex flex-col">
            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
              {/* Header */}
              <div className="p-8 border-b border-slate-100 shrink-0 bg-white">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                    <RotateCcw className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {selectedAgent.user_name}
                    </h3>
                    <div className="flex items-center gap-3 mt-2">
                       <Badge variant="secondary" className="bg-blue-50 text-blue-700 px-3 py-1 font-bold">
                         {filteredRecords.length} Rework Files
                       </Badge>
                       <span className="text-slate-500 text-sm font-bold bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                          {startDate} to {endDate}
                       </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="p-8 bg-slate-50/50 flex flex-col md:flex-row items-end gap-6 border-b border-slate-100 shrink-0">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> From Date
                    </label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-12 bg-white border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> To Date
                    </label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-12 bg-white border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleResetToToday}
                  className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg"
                >
                  Reset
                </Button>
              </div>

              {/* Table */}
              <ScrollArea className="flex-1">
                <div className="p-8">
                  <DataTable
                    columns={reworkReportColumns}
                    data={filteredRecords}
                    loading={false}
                    emptyMessage="No rework files found."
                    showPagination={true}
                    pageSize={10}
                  />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
             <RotateCcw className="w-16 h-16 text-slate-200 mb-6" />
             <h4 className="text-xl font-bold text-slate-800">Select an Agent</h4>
             <p className="text-slate-500 text-center mt-2 max-w-sm">
               Choose an agent from the list to view their rework and correction history.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentReworkReportView;
