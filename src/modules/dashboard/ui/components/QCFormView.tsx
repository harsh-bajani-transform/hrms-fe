import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ArrowLeft,
  Download,
  FileText,
  User,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Briefcase,
  FolderOpen,
  Target,
  ListChecks,
  XCircle,
  Award,
  ClipboardCheck,
  Loader,
  Send,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { createQCFormColumns } from "./QCFormColumns";
import { DataTable } from "@/components/ui/data-table";
import { toast } from "sonner";
import { useAuth } from "../../../../context/AuthContext";
import {
  generateQCSample,
  saveQCRecord,
  fetchAFDList,
} from "../../../../services/qcService";
import type {
  RawAFDMaster,
  RawAFDCategory,
  RawAFDSubcategory,
  SampleResponseData,
  QCErrorListItem,
} from "../../../../services/qcService";
import { Button } from "@/components/ui/button";
import QCConfirmationModal from "../../../../components/common/QCConfirmationModal";
import type { QCConfirmationData } from "../../../../components/common/QCConfirmationModal";
import type {
  AFDData,
  AFDCategory,
  AFDSubcategory,
  FormRow,
  QCFormViewProps,
  ErrorSelection,
  PendingSelection,
} from "../../types";

// ─── Submission type literal ────────────────────────────────────
type SubmissionType = "regular" | "rework" | "correction" | "";

// ─── Component ──────────────────────────────────────────────────

const QCFormView: React.FC<QCFormViewProps> = ({
  tracker,
  onBack,
  onSubmitSuccess,
}) => {
  const { user } = useAuth();

  // Loading / saving
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // AFD data (transformed)
  const [afdData, setAfdData] = useState<AFDData | null>(null);

  // 10 % sample rows
  const [formRows, setFormRows] = useState<FormRow[]>([]);
  const [sampleRawData, setSampleRawData] = useState<Record<string, unknown>[]>(
    [],
  );

  // Counts from API
  const [totalRecords, setTotalRecords] = useState(0);
  const [sampleSize, setSampleSize] = useState(0);

  // Score
  const [qcScore, setQcScore] = useState(0);

  // Submission modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submissionType, setSubmissionType] = useState<SubmissionType>("");

  // Pending error selections per row
  const [pendingSelections, setPendingSelections] = useState<
    Record<string | number, PendingSelection>
  >({});

  // Pagination state
  const [itemsPerPage] = useState(10);

  // ─── Scoring ────────────────────────────────────────────────

  const calculateRecordScore = useCallback(
    (row: FormRow, afd: AFDData | null): number => {
      if (!afd || !afd.categories) return 100;

      // Check fatal errors (points >= 100)
      const hasFatalError = row.errors.some((error: ErrorSelection) => {
        const cat = afd.categories.find(
          (c) => c.qc_afd_id === error.categoryId,
        );
        const sub = cat?.subcategories.find(
          (s) => s.qc_afd_id === error.subcategoryId,
        );
        return sub != null && sub.points >= 100;
      });

      if (hasFatalError) return 0;

      const categoryScores = afd.categories.map((category) => {
        let catScore = 100;
        const catErrors = row.errors.filter(
          (err: ErrorSelection) => err.categoryId === category.qc_afd_id,
        );
        catErrors.forEach((err: ErrorSelection) => {
          const sub = category.subcategories.find(
            (s) => s.qc_afd_id === err.subcategoryId,
          );
          if (sub) catScore -= sub.points;
        });
        return Math.max(0, catScore);
      });

      return categoryScores.length > 0
        ? categoryScores.reduce((sum, s) => sum + s, 0) / categoryScores.length
        : 100;
    },
    [],
  );

  const calculateQCScore = useCallback(
    (rows: FormRow[], afd: AFDData | null) => {
      if (!afd || !afd.categories || afd.categories.length === 0) {
        setQcScore(0);
        return;
      }
      const scores = rows.map((r) => calculateRecordScore(r, afd));
      const avg =
        scores.length > 0
          ? scores.reduce((sum, s) => sum + s, 0) / scores.length
          : 0;
      setQcScore(Number(avg.toFixed(2)));
    },
    [calculateRecordScore],
  );

  // ─── Fetch AFD + Sample Data ────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let transformedAFD: AFDData | null = null;

      // 1. Fetch AFD from Python API
      const afdResponse = await fetchAFDList();
      const rawList = afdResponse.data as RawAFDMaster[];

      if (Array.isArray(rawList) && rawList.length > 0) {
        const raw =
          rawList.find(
            (a: RawAFDMaster) => a.categories && a.categories.length > 0,
          ) ?? rawList[0];

        if (raw) {
          transformedAFD = {
            afd_id: Number(raw.afd_id),
            afd_name: String(raw.afd_name),
            categories: (raw.categories || []).map(
              (cat: RawAFDCategory): AFDCategory => ({
                qc_afd_id: Number(cat.qc_afd_id),
                name: String(cat.afd_name),
                points: Number(cat.afd_points),
                subcategories: (cat.subcategories || []).map(
                  (sub: RawAFDSubcategory): AFDSubcategory => ({
                    qc_afd_id: Number(sub.qc_afd_id),
                    name: String(sub.afd_name),
                    points: Number(sub.afd_points),
                  }),
                ),
              }),
            ),
          };
          setAfdData(transformedAFD);
        }
      }

      // 2. Fetch 10 % sample from Node API
      if (tracker?.tracker_id && user?.user_id) {
        const sampleResponse = await generateQCSample(
          tracker.tracker_id,
          user.user_id,
        );

        if (sampleResponse.success && sampleResponse.data) {
          const data = sampleResponse.data as SampleResponseData;
          const sampleData = data.sample_data || [];

          setTotalRecords(data.total_records || 0);
          setSampleSize(data.sample_size || 0);
          setSampleRawData(sampleData);

          const initialRows: FormRow[] = sampleData.map(
            (d: Record<string, unknown>, idx: number) => ({
              id: (d.id as string | number) || idx + 1,
              originalData: d,
              errors: [],
            }),
          );
          setFormRows(initialRows);
          calculateQCScore(initialRows, transformedAFD);
        }
      }
    } catch (error) {
      console.error("Failed to fetch QC form data", error);
      toast.error("Failed to load QC form data");
    } finally {
      setLoading(false);
    }
  }, [tracker, user, calculateQCScore]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Error Management ──────────────────────────────────────

  const handleAddError = useCallback(
    (rowId: string | number) => {
      const pending = pendingSelections[rowId];
      if (
        !pending ||
        !pending.category ||
        !pending.subcategories ||
        pending.subcategories.length === 0
      )
        return;

      setFormRows((prev) => {
        const updated = prev.map((row) => {
          if (row.id !== rowId) return row;

          const newErrors = [...row.errors];
          pending.subcategories.forEach((subcategoryId) => {
            const categoryId = Number(pending.category);
            const exists = newErrors.some(
              (e) =>
                e.categoryId === categoryId &&
                e.subcategoryId === subcategoryId,
            );
            if (!exists) {
              newErrors.push({ categoryId, subcategoryId });
            }
          });

          return { ...row, errors: newErrors };
        });

        calculateQCScore(updated, afdData);
        return updated;
      });

      // Clear pending selection
      setPendingSelections((prev) => {
        const next = { ...prev };
        delete next[rowId];
        return next;
      });
    },
    [pendingSelections, afdData, calculateQCScore],
  );

  const handleRemoveError = useCallback(
    (rowId: string | number, errorIndex: number) => {
      setFormRows((prev) => {
        const updated = prev.map((row) => {
          if (row.id !== rowId) return row;
          const newErrors = [...row.errors];
          newErrors.splice(errorIndex, 1);
          return { ...row, errors: newErrors };
        });
        calculateQCScore(updated, afdData);
        return updated;
      });
    },
    [afdData, calculateQCScore],
  );

  // ─── Error Metrics ─────────────────────────────────────────

  const errorMetrics = useMemo(() => {
    const totalErrors = formRows.reduce(
      (sum, row) => sum + row.errors.length,
      0,
    );

    // Build error list with counts
    const errorMap = new Map<string, number>();
    formRows.forEach((row) => {
      row.errors.forEach((error: ErrorSelection) => {
        const category = afdData?.categories.find(
          (cat) => cat.qc_afd_id === error.categoryId,
        );
        const subcategory = category?.subcategories.find(
          (sub) => sub.qc_afd_id === error.subcategoryId,
        );

        if (category && subcategory) {
          const key = `${category.name} - ${subcategory.name}`;
          errorMap.set(key, (errorMap.get(key) || 0) + 1);
        }
      });
    });

    const errorList = Array.from(errorMap.entries()).map(([name, count]) => ({
      name,
      count,
    }));

    // Determine status
    let status: "regular" | "rework" | "correction" = "regular";
    if (qcScore < 80) {
      status = "correction";
    } else if (qcScore < 95) {
      status = "rework";
    }

    return { totalErrors, errorList, status };
  }, [formRows, afdData, qcScore]);

  // ─── Submission Handlers ───────────────────────────────────

  const handleRegularSubmit = () => {
    setSubmissionType("regular");
    setShowConfirmModal(true);
  };

  const handleReworkSubmit = () => {
    setSubmissionType("rework");
    setShowConfirmModal(true);
  };

  const handleCorrection = () => {
    setSubmissionType("correction");
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async (comments: string) => {
    try {
      setSaving(true);

      if (!tracker || !user) {
        throw new Error("Missing tracker data or user information");
      }

      // Build error list
      const errorList: QCErrorListItem[] = [];
      formRows.forEach((row, rowIndex) => {
        row.errors.forEach((error: ErrorSelection) => {
          const category = afdData?.categories.find(
            (cat) => cat.qc_afd_id === error.categoryId,
          );
          const subcategory = category?.subcategories.find(
            (sub) => sub.qc_afd_id === error.subcategoryId,
          );

          if (category && subcategory) {
            errorList.push({
              row: rowIndex + 1,
              category: category.name,
              subcategory: subcategory.name,
              error: `${category.name} - ${subcategory.name}`,
              points: subcategory.points,
            });
          }
        });
      });

      const status = submissionType || errorMetrics.status;

      // Extract date
      let formattedDate = "";
      const possibleDates = [
        tracker.date_time as string | undefined,
        tracker.date as string | undefined,
      ].filter(Boolean);

      const dateSource = possibleDates.find(
        (d) => d != null && String(d).trim() !== "",
      );
      if (dateSource) {
        const clean = String(dateSource).trim();
        if (clean.includes("T")) {
          formattedDate = clean.split("T")[0] ?? clean;
        } else if (clean.includes(" ")) {
          formattedDate = clean.split(" ")[0] ?? clean;
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
          formattedDate = clean;
        }
      }

      if (!formattedDate) {
        const today = new Date();
        formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      }

      // Extract assistant manager ID
      const extractValidId = (id: unknown): number | null => {
        const numId = id ? Number(id) : null;
        return numId != null && numId > 0 ? numId : null;
      };

      const assManagerId =
        extractValidId(tracker.assistant_manager_id) ??
        extractValidId(tracker.asst_manager_id) ??
        extractValidId(tracker.ass_manager_id) ??
        extractValidId(tracker.project_manager_id) ??
        extractValidId(tracker.manager_id) ??
        null;

      const userId = user.user_id ?? user.id ?? 0;

      const payload = {
        logged_in_user_id: userId,
        tracker_id: tracker.tracker_id as number | string,
        ass_manager_id: assManagerId,
        qc_user_id: userId,
        agent_user_id:
          (tracker.user_id as number | string) ||
          (tracker.agent_user_id as number | string) ||
          (tracker.agent_id as number | string) ||
          0,
        project_id: (tracker.project_id as number | string) || 0,
        task_id: (tracker.task_id as number | string) || 0,
        file_path: String(tracker.tracker_file || tracker.file_path || ""),
        date_of_file_submission: formattedDate,
        qc_score: parseFloat(qcScore.toFixed(2)),
        status,
        file_record_count: totalRecords || formRows.length,
        data_generated_count: sampleSize || formRows.length,
        qc_file_records: sampleRawData,
        error_score: parseFloat((100 - qcScore).toFixed(2)),
        error_list: errorList,
        comments: comments || "",
      };

      const response = await saveQCRecord(payload);

      if (response.success) {
        const successMessage =
          submissionType === "regular"
            ? "QC Form submitted & email notification sent!"
            : submissionType === "rework"
              ? "QC submitted for Rework & email notification sent!"
              : "Correction request submitted & email notification sent!";

        toast.success(successMessage);
        setShowConfirmModal(false);
        onSubmitSuccess();
      } else {
        throw new Error(response.message || "Failed to save QC record");
      }
    } catch (err: unknown) {
      console.error("Error submitting form:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to submit QC form";
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  // ─── File Download ─────────────────────────────────────────

  const handleDownload = () => {
    if (tracker?.tracker_id) {
      const backendUrl =
        import.meta.env.VITE_API_NODE_BASE_URL ||
        "http://localhost:8000/api/v1";
      const fileUrl = `${backendUrl}/qc-records/download-sample/${tracker.tracker_id}?logged_in_user_id=${user?.user_id}`;
      window.open(fileUrl, "_blank");
      toast.success("Downloading 10% sample file…");
    } else {
      toast.error("No file available for download");
    }
  };

  // ─── Dynamic column keys from sample data ──────────────────

  const dynamicKeys = useMemo(() => {
    const firstRow = sampleRawData[0];
    if (!firstRow) return [];
    return Object.keys(firstRow)
      .filter((key) => key !== "id")
      .slice(0, 3);
  }, [sampleRawData]);

  // ─── Category score for a single row ───────────────────────

  const getCategoryScore = useCallback(
    (row: FormRow, categoryId: number): number => {
      if (!afdData) return 100;

      // Fatal error check
      const hasFatalError = row.errors.some((error: ErrorSelection) => {
        const cat = afdData.categories.find(
          (c) => c.qc_afd_id === error.categoryId,
        );
        const sub = cat?.subcategories.find(
          (s) => s.qc_afd_id === error.subcategoryId,
        );
        return sub != null && sub.points >= 100;
      });
      if (hasFatalError) return 0;

      const category = afdData.categories.find(
        (cat) => cat.qc_afd_id === categoryId,
      );
      if (!category) return 100;

      let catScore = 100;
      const catErrors = row.errors.filter(
        (err: ErrorSelection) => err.categoryId === categoryId,
      );
      catErrors.forEach((err: ErrorSelection) => {
        const sub = category.subcategories.find(
          (s) => s.qc_afd_id === err.subcategoryId,
        );
        if (sub) catScore -= sub.points;
      });
      return Math.max(0, catScore);
    },
    [afdData],
  );

  // ─── Columns Definition ─────────────────────────────────────

  const columns = useMemo<ColumnDef<FormRow>[]>(
    () =>
      createQCFormColumns({
        afdData,
        dynamicKeys,
        pendingSelections,
        setPendingSelections,
        handleAddError,
        handleRemoveError,
        calculateRecordScore,
        getCategoryScore,
      }),
    [
      afdData,
      dynamicKeys,
      pendingSelections,
      handleAddError,
      handleRemoveError,
      calculateRecordScore,
      getCategoryScore,
    ],
  );

  // ─── Loading State ─────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-blue-600" />
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
        </div>

        {/* QC Form Heading */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg shadow-sm">
            <FileText className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              QC Form
            </h2>
            <p className="text-slate-600 font-medium">
              Review sampled records and mark errors
            </p>
          </div>
        </div>

        {/* Agent Info & File Details */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoItem
              icon={<User className="w-6 h-6 text-blue-600" />}
              bgColor="bg-blue-100"
              label="Agent Name"
              value={String(tracker.user_name || "N/A")}
            />
            <InfoItem
              icon={<FileText className="w-6 h-6 text-green-600" />}
              bgColor="bg-green-100"
              label="File Name"
              value={
                tracker.tracker_file
                  ? String(tracker.tracker_file).split("/").pop() || "No file"
                  : "No file"
              }
            />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Download className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-600 font-medium">
                  Download File
                </p>
                <button
                  onClick={handleDownload}
                  disabled={!tracker.tracker_file}
                  className="text-sm font-bold text-emerald-600 hover:text-emerald-700 disabled:text-slate-400 underline"
                >
                  {tracker.tracker_file
                    ? "Click to Download"
                    : "No file available"}
                </button>
              </div>
            </div>
            <InfoItem
              icon={<Calendar className="w-6 h-6 text-purple-600" />}
              bgColor="bg-purple-100"
              label="Submission Date & Time"
              value={
                tracker.date_time
                  ? String(tracker.date_time)
                      .replace(/:\d{2}\s*GMT.*$/, "")
                      .trim()
                  : "N/A"
              }
            />
            <InfoItem
              icon={<FolderOpen className="w-6 h-6 text-orange-600" />}
              bgColor="bg-orange-100"
              label="Project Name"
              value={String(tracker.project_name || "N/A")}
            />
            <InfoItem
              icon={<Briefcase className="w-6 h-6 text-indigo-600" />}
              bgColor="bg-indigo-100"
              label="Task Name"
              value={String(tracker.task_name || "N/A")}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <DataTable
            columns={columns}
            data={formRows}
            loading={loading}
            pageSize={itemsPerPage}
            containerClassName="border-0 shadow-none"
            tableClassName="border-0"
            rowClassName="border-b border-slate-100 last:border-0"
            rowHoverClassName="hover:bg-slate-50 transition-colors"
          />
        </div>

        {/* QA Information Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-blue-600" />
            Quality Assurance Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* QA Name */}
            <StatCard
              icon={<User className="w-6 h-6 text-blue-600" />}
              bgColor="bg-blue-100"
              label="QA Name"
              value={String(user?.user_name || user?.name || "N/A")}
            />

            {/* Final QC Score */}
            <StatCard
              icon={
                <Award
                  className={`w-6 h-6 ${qcScore >= 95 ? "text-green-600" : qcScore >= 80 ? "text-yellow-600" : "text-red-600"}`}
                />
              }
              bgColor={
                qcScore >= 95
                  ? "bg-green-100"
                  : qcScore >= 80
                    ? "bg-yellow-100"
                    : "bg-red-100"
              }
              label="Final QC Score"
              value={`${qcScore.toFixed(2)}%`}
              valueColor={
                qcScore >= 95
                  ? "text-green-600"
                  : qcScore >= 80
                    ? "text-yellow-600"
                    : "text-red-600"
              }
              large
            />

            {/* Status */}
            <StatCard
              icon={
                errorMetrics.status === "regular" ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : errorMetrics.status === "rework" ? (
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )
              }
              bgColor={
                errorMetrics.status === "regular"
                  ? "bg-green-100"
                  : errorMetrics.status === "rework"
                    ? "bg-yellow-100"
                    : "bg-red-100"
              }
              label="Status"
              value={
                errorMetrics.status.charAt(0).toUpperCase() +
                errorMetrics.status.slice(1)
              }
              valueColor={
                errorMetrics.status === "regular"
                  ? "text-green-600"
                  : errorMetrics.status === "rework"
                    ? "text-yellow-600"
                    : "text-red-600"
              }
            />

            {/* Record Count */}
            <StatCard
              icon={<FileText className="w-6 h-6 text-purple-600" />}
              bgColor="bg-purple-100"
              label="Record Count in File"
              value={String(totalRecords || formRows.length)}
              large
            />

            {/* 10% Data Count */}
            <StatCard
              icon={<Target className="w-6 h-6 text-indigo-600" />}
              bgColor="bg-indigo-100"
              label="10% Data Generated"
              value={String(sampleSize || formRows.length)}
              large
            />

            {/* Total Errors */}
            <StatCard
              icon={<XCircle className="w-6 h-6 text-red-600" />}
              bgColor="bg-red-100"
              label="Total Errors Marked"
              value={String(errorMetrics.totalErrors)}
              valueColor="text-red-600"
              large
            />
          </div>

          {/* Error Breakdown */}
          {errorMetrics.errorList.length > 0 && (
            <div className="mt-6 bg-slate-50 rounded-lg p-5 shadow-sm border border-slate-200">
              <h3 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-blue-600" />
                Error Breakdown
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {errorMetrics.errorList.map((error, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {error.name}
                    </span>
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-full">
                      {error.count} {error.count === 1 ? "error" : "errors"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          <Button
            onClick={onBack}
            variant="secondary"
            className="px-6 py-3 font-bold rounded-xl shadow-md"
          >
            Cancel
          </Button>

          {/* Correction Button — always visible */}
          <Button
            onClick={handleCorrection}
            disabled={saving}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5" />
                Correction
              </>
            )}
          </Button>

          {/* Regular Submit — only when score >= 95 */}
          {qcScore >= 95 && (
            <Button
              onClick={handleRegularSubmit}
              disabled={saving}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Regular Submit
                </>
              )}
            </Button>
          )}

          {/* Rework Submit — only when score < 95 */}
          {qcScore < 95 && (
            <Button
              onClick={handleReworkSubmit}
              disabled={saving}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Rework Submit
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <QCConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSubmit}
        submissionType={submissionType}
        loading={saving}
        data={
          {
            qaName: String(user?.user_name || user?.name || "N/A"),
            agentEmail: String(tracker?.user_email || tracker?.email || "N/A"),
            projectName: String(tracker?.project_name || "N/A"),
            taskName: String(tracker?.task_name || "N/A"),
            status: submissionType || errorMetrics.status,
            qcScore,
            errorCount: errorMetrics.totalErrors,
            errorList: errorMetrics.errorList,
          } satisfies QCConfirmationData
        }
      />
    </>
  );
};

// ─── Helper Components ─────────────────────────────────────────

interface InfoItemProps {
  icon: React.ReactNode;
  bgColor: string;
  label: string;
  value: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon, bgColor, label, value }) => (
  <div className="flex items-center gap-3">
    <div
      className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center`}
    >
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-slate-600 font-medium">{label}</p>
      <p className="text-lg font-bold text-slate-800 truncate">{value}</p>
    </div>
  </div>
);

interface StatCardProps {
  icon: React.ReactNode;
  bgColor: string;
  label: string;
  value: string;
  valueColor?: string;
  large?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  bgColor,
  label,
  value,
  valueColor = "text-slate-800",
  large = false,
}) => (
  <div className="bg-slate-50 rounded-lg p-4 shadow-sm border border-slate-200">
    <div className="flex items-center gap-3">
      <div
        className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center`}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-600 font-medium">{label}</p>
        <p
          className={`${large ? "text-2xl" : "text-lg"} font-bold ${valueColor}`}
        >
          {value}
        </p>
      </div>
    </div>
  </div>
);

export default QCFormView;
