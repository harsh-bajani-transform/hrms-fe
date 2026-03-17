import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  FileCheck,
  Search,
  X,
  RotateCcw,
  AlertCircle,
  FileText,
  CheckCircle2,
  XCircle,
  Award,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../../context/AuthContext";
import { getQCRecordsList } from "../../../../services/qcService";
import { DataTable } from "@/components/ui/data-table";
import { createQCReportColumns, QCReport } from "./QCFormReportViewColumns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SearchableSelect from "../../../../components/common/SearchableSelect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const QCFormReportView: React.FC = () => {
  const { user } = useAuth();
  const [qcReports, setQcReports] = useState<QCReport[]>([]);
  const [loading, setLoading] = useState(true);
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState(getTodayDate());
  const [selectedErrors, setSelectedErrors] = useState<QCReport | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      // If user is Agent (and not QA/Admin), API will filter for their own records
      const roleName = (user?.role_name || "").toLowerCase();
      const designation = (user?.designation_name || "").toLowerCase();
      const isAgentView =
        (roleName === "agent" || designation === "agent") &&
        !(roleName.includes("qa") || designation.includes("qa"));

      const userIdToPass = isAgentView ? user?.user_id : null;

      const response = await getQCRecordsList(
        userIdToPass as string | number | null,
      );
      if (response && response.success) {
        setQcReports((response.data as QCReport[]) || []);
      }
    } catch (error) {
      console.error("Failed to fetch QC reports", error);
      toast.error("Failed to fetch QC reports");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Filter and search logic
  const filteredReports = useMemo(() => {
    let filtered = qcReports;

    // Filter by date range (timestamp)
    if (startDate && endDate) {
      filtered = filtered.filter((report) => {
        if (!report.timestamp) return false;
        const ts = report.timestamp.toString();
        const evalDate = ts.includes("T") ? ts.split("T")[0] : ts.split(" ")[0];
        if (!evalDate) return false;
        return evalDate >= startDate && evalDate <= endDate;
      });
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (report) =>
          (report.status || "").trim().toLowerCase() ===
          statusFilter.toLowerCase(),
      );
    }

    // Search across multiple fields
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (report) =>
          (report.agent_name || "").toLowerCase().includes(query) ||
          (report.qa_name || "").toLowerCase().includes(query) ||
          (report.am_name || "").toLowerCase().includes(query) ||
          (report.project_name || "").toLowerCase().includes(query) ||
          (report.task_name || "").toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [qcReports, searchQuery, statusFilter, startDate, endDate]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setStartDate(getTodayDate());
    setEndDate(getTodayDate());
  };

  // Calculate summary stats
  const stats = useMemo(() => {
    const total = filteredReports.length;
    if (total === 0)
      return {
        total: 0,
        regular: 0,
        rework: 0,
        correction: 0,
        avgScore: "0.00",
      };

    const regular = filteredReports.filter(
      (r) => (r.status || "").toLowerCase().trim() === "regular",
    ).length;
    const rework = filteredReports.filter(
      (r) => (r.status || "").toLowerCase().trim() === "rework",
    ).length;
    const correction = filteredReports.filter(
      (r) => (r.status || "").toLowerCase().trim() === "correction",
    ).length;
    const avgScore =
      total > 0
        ? (
            filteredReports.reduce(
              (sum, r) => sum + parseFloat(String(r.qc_score || 0)),
              0,
            ) / total
          ).toFixed(2)
        : "0.00";

    return { total, regular, rework, correction, avgScore };
  }, [filteredReports]);

  const columns = useMemo(
    () =>
      createQCReportColumns({
        onViewErrors: (report) => setSelectedErrors(report),
      }),
    [],
  );

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            Advanced Filters
          </h3>
          {(searchQuery ||
            statusFilter !== "all" ||
            startDate !== getTodayDate() ||
            endDate !== getTodayDate()) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-slate-500 hover:text-red-600 font-bold"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Agent, QA, Project..."
                className="pl-9 h-11 border-slate-200 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
              Status
            </label>
            <SearchableSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(String(val))}
              options={[
                { value: "all", label: "All Status" },
                { value: "Regular", label: "Regular" },
                { value: "Rework", label: "Rework" },
                { value: "Correction", label: "Correction" },
              ]}
              placeholder="Filter by status"
              className="h-11 shadow-none"
            />
          </div>

          {/* Date Range - From */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
              From Date
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-9 h-11 border-slate-200 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Date Range - To */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
              To Date
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-9 h-11 border-slate-200 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          label="Total"
          value={stats.total}
          icon={<FileCheck className="w-5 h-5 text-blue-600" />}
          bgColor="bg-blue-50"
        />
        <StatCard
          label="Regular"
          value={stats.regular}
          icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
          bgColor="bg-green-50"
        />
        <StatCard
          label="Rework"
          value={stats.rework}
          icon={<XCircle className="w-5 h-5 text-orange-600" />}
          bgColor="bg-orange-50"
        />
        <StatCard
          label="Correction"
          value={stats.correction}
          icon={<AlertCircle className="w-5 h-5 text-red-600" />}
          bgColor="bg-red-50"
        />
        <StatCard
          label="Avg Score"
          value={`${stats.avgScore}%`}
          icon={<Award className="w-5 h-5 text-purple-600" />}
          bgColor="bg-purple-50"
        />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredReports}
          loading={loading}
          emptyMessage="No QC reports found."
          showPagination={true}
          pageSize={10}
        />
      </div>

      {/* Error List Dialog */}
      <Dialog
        open={!!selectedErrors}
        onOpenChange={(open) => !open && setSelectedErrors(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Error Details
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
            {selectedErrors &&
              (() => {
                let eList = [];
                try {
                  const raw = selectedErrors.error_list;
                  eList = typeof raw === "string" ? JSON.parse(raw) : raw || [];
                } catch {
                  eList = [];
                }

                if (eList.length === 0) {
                  return (
                    <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                      No errors logged for this report.
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {eList.map((error: any, idx: number) => {
                      const errorLabel =
                        typeof error === "object" && error !== null
                          ? error.error || error.name || JSON.stringify(error)
                          : String(error);
                      return (
                        <div
                          key={idx}
                          className="flex items-start gap-4 p-4 bg-red-50 border border-red-100 rounded-xl transition-all hover:bg-red-100/50"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-200/50 flex items-center justify-center shrink-0">
                            <span className="text-red-700 font-bold text-xs">
                              {idx + 1}
                            </span>
                          </div>
                          <span className="text-sm text-slate-700 font-semibold leading-relaxed">
                            {errorLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setSelectedErrors(null)}
              variant="secondary"
              className="w-full font-bold h-11 rounded-lg"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, bgColor }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 transition-all hover:shadow-md group">
    <div className="flex items-center justify-between mb-3">
      <div
        className={`p-2.5 ${bgColor} rounded-lg group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        {label}
      </p>
      <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
        {value}
      </h3>
    </div>
  </div>
);

export default QCFormReportView;
