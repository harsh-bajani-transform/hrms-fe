import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Download,
  Search,
  Calendar as CalendarIcon,
  FileX,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import dayjs from "dayjs";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";

import {
  fetchProjectMonthlyReport,
  addProjectMonthlyTarget,
  updateProjectMonthlyTarget,
  deleteProjectMonthlyTarget,
  type ProjectMonthlyReportRow,
} from "../../services/billableReportService";
import { fetchProjectsList } from "../../../manage/services/manageService";
import { useAuth } from "../../../../context/AuthContext";
import {
  createColumns,
  type ProjectReportRow,
} from "./ProjectMonthlyReportColumns";
import Loading from "@/components/common/Loading";

const ProjectMonthlyReport: React.FC = () => {
  const { user } = useAuth();

  const [projects, setProjects] = useState<any[]>([]);
  const [reportData, setReportData] = useState<ProjectMonthlyReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    dayjs().format("MMMYYYY").toUpperCase(),
  );

  // Edit/Add states
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [addingProjectId, setAddingProjectId] = useState<
    string | number | null
  >(null);
  const [editData, setEditData] = useState<any>({});
  const [addData, setAddData] = useState<any>({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectsRes, reportRes] = await Promise.all([
        fetchProjectsList(user?.user_id),
        fetchProjectMonthlyReport(),
      ]);

      if (projectsRes?.data) {
        setProjects(projectsRes.data);
      }
      if (reportRes?.data?.rows) {
        setReportData(reportRes.data.rows);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load report data");
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getCurrentMonthYear = () => {
    return dayjs().format("MMMYYYY").toUpperCase();
  };

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(getCurrentMonthYear());
    reportData.forEach((r) => months.add(r.month_year));
    return Array.from(months).sort((a, b) => {
      const dateA = dayjs(a, "MMMYYYY");
      const dateB = dayjs(b, "MMMYYYY");
      return dateB.isBefore(dateA) ? -1 : 1;
    });
  }, [reportData]);

  // Handle CRUD
  const handleEdit = (row: ProjectReportRow) => {
    setEditingId(row.project_monthly_tracker_id);
    setEditData({ monthly_target: row.monthly_target });
  };

  const handleDelete = async (row: ProjectReportRow) => {
    if (!window.confirm("Are you sure you want to delete this target?")) return;
    try {
      await deleteProjectMonthlyTarget(row.project_monthly_tracker_id);
      toast.success("Target deleted successfully");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete target");
    }
  };

  const handleAdd = (row: ProjectReportRow) => {
    setAddingProjectId(row.project_id);
    setAddData({ monthly_target: "" });
  };

  const onSaveEdit = async (id: string | number) => {
    try {
      if (!editData.monthly_target) {
        toast.error("Please enter a target");
        return;
      }
      await updateProjectMonthlyTarget({
        project_monthly_tracker_id: id,
        month_year:
          reportData.find((r) => r.project_monthly_tracker_id === id)
            ?.month_year || "",
        monthly_target: editData.monthly_target,
      });
      toast.success("Target updated successfully");
      setEditingId(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update target");
    }
  };

  const onSaveAdd = async () => {
    try {
      if (!addData.monthly_target) {
        toast.error("Please enter a target");
        return;
      }
      const monthYear =
        selectedMonth === "all" ? getCurrentMonthYear() : selectedMonth;
      await addProjectMonthlyTarget({
        project_id: addingProjectId!,
        month_year: monthYear,
        monthly_target: addData.monthly_target,
      });
      toast.success("Target added successfully");
      setAddingProjectId(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to add target");
    }
  };

  const columns = useMemo(
    () =>
      createColumns(
        handleEdit,
        handleDelete,
        handleAdd,
        editingId,
        addingProjectId,
        editData,
        setEditData,
        onSaveEdit,
        () => setEditingId(null),
        addData,
        setAddData,
        onSaveAdd,
        () => setAddingProjectId(null),
      ),
    [editingId, addingProjectId, editData, addData, reportData, selectedMonth],
  );

  const displayData = useMemo(() => {
    const monthYear =
      selectedMonth === "all" ? getCurrentMonthYear() : selectedMonth;

    // Merge projects with report data for specific month
    let merged = projects.map((p) => {
      const report = reportData.find(
        (r) => r.project_id === p.project_id && r.month_year === monthYear,
      );
      if (report) {
        return { ...report, isNew: false };
      }
      return {
        project_id: p.project_id,
        project_name: p.project_name,
        month_year: monthYear,
        monthly_target: 0,
        isNew: true,
      } as ProjectReportRow;
    });

    if (searchTerm) {
      merged = merged.filter((p) =>
        p.project_name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    return merged;
  }, [projects, reportData, selectedMonth, searchTerm]);

  const handleExport = () => {
    const monthYear =
      selectedMonth === "all" ? getCurrentMonthYear() : selectedMonth;
    const exportData = displayData.map((r) => ({
      "Project Name": r.project_name,
      "Month/Year": r.month_year,
      "Monthly Target": r.isNew ? "-" : r.monthly_target,
      "Achieved Target": r.isNew ? "-" : r.achieved_hours || 0,
      "Pending Target": r.isNew ? "-" : r.pending_hours || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `Project_Monthly_Report_${monthYear}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header card with gradient */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-row items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <BarChart3 className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Project Monthly Report</h2>
              <p className="text-slate-600 mt-1 font-medium">
                Track and manage project-wise monthly targets and performance
              </p>
            </div>
          </div>
          <div>
            <Button
              onClick={handleExport}
              className="bg-emerald-600 hover:bg-emerald-700 font-semibold gap-2 px-6 shadow-sm rounded-lg transition-all text-white"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search projects..."
            className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/10 rounded-lg transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 whitespace-nowrap">
            <CalendarIcon className="w-4 h-4" />
            Filter Month:
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full md:w-[180px] h-11 border-slate-200 rounded-lg">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        {loading ? (
          <Loading
            title="Loading project reports..."
            description="Compiling project reports"
            fullHeight={false}
          />
        ) : displayData.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <FileX className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">
              No projects found
            </h3>
            <p className="text-slate-500 max-w-xs mx-auto">
              Try adjusting your search or filters to find what you're looking
              for.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={displayData}
            loading={loading}
            emptyMessage="No performance data found for this period."
            emptyIcon={BarChart3}
            showPagination={true}
            pageSize={10}
            containerClassName="rounded-2xl border border-slate-200 shadow-lg bg-white overflow-hidden"
            headerClassName=""
            rowClassName="border-b border-slate-100"
            rowHoverClassName="hover:bg-blue-50/60 transition-colors"
          />
        )}
      </div>

      {/* Summary Row */}
      {!loading && displayData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl shadow-sm">
            <p className="text-blue-600 text-[11px] font-bold uppercase tracking-wider mb-1">
              Total Monthly Target
            </p>
            <p className="text-3xl font-bold text-blue-900">
              {displayData
                .reduce((sum, r) => sum + (Number(r.monthly_target) || 0), 0)
                .toFixed(2)}
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl shadow-sm">
            <p className="text-emerald-600 text-[11px] font-bold uppercase tracking-wider mb-1">
              Total Achieved Target
            </p>
            <p className="text-3xl font-bold text-emerald-900">
              {displayData
                .reduce((sum, r) => sum + (Number(r.achieved_hours) || 0), 0)
                .toFixed(2)}
            </p>
          </div>
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl shadow-sm">
            <p className="text-rose-600 text-[11px] font-bold uppercase tracking-wider mb-1">
              Total Pending Target
            </p>
            <p className="text-3xl font-bold text-rose-900">
              {displayData
                .reduce((sum, r) => sum + (Number(r.pending_hours) || 0), 0)
                .toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectMonthlyReport;
