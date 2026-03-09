import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "../../../../context/AuthContext";
import {
  ArrowLeft,
  Download,
  User,
  FolderOpen,
  ClipboardCheck,
  Plus,
  X,
} from "lucide-react";
import {
  generateQCSample,
  saveQCRecord,
  fetchAFDList,
} from "../../../../services/qcService";
import SearchableSelect from "../../../../components/common/SearchableSelect";
import MultiSelectWithCheckbox from "../../../../components/common/MultiSelectWithCheckbox";
import QCConfirmationModal from "../../../../components/common/QCConfirmationModal";
import Loading from "../../../../components/common/Loading";
import ErrorMessage from "../../../../components/common/ErrorMessage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import config from "../../../../config/environment";
import {
  AFDApiCategory,
  AFDApiItem,
  AFDApiSubcategory,
  AFDData,
  FormRow,
  PendingSelection,
  QCErrorEntry,
  SampleRecord,
  TrackerData,
} from "../../types";

// ─── Component ───────────────────────────────────────────────────────────────

const QCForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const trackerData = (
    location.state as unknown as Record<string, unknown> | null
  )?.tracker as TrackerData | undefined;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<SampleRecord[]>([]);
  const [afdData, setAfdData] = useState<AFDData | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sampleSize, setSampleSize] = useState(0);

  const [formRows, setFormRows] = useState<FormRow[]>([]);
  const [qcScore, setQcScore] = useState(100);
  const [pendingSelections, setPendingSelections] = useState<
    Record<string, PendingSelection>
  >({});

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ── Derived metrics ──────────────────────────────────────────────────────

  const errorMetrics = useMemo(() => {
    const recordCount = formRows.length;
    const tenPercentCount = Math.ceil(recordCount * 0.1);
    const totalErrors = formRows.reduce(
      (sum, row) => sum + row.errors.length,
      0,
    );

    const errorMap = new Map<string, number>();
    formRows.forEach((row) => {
      row.errors.forEach((err) => {
        const category = afdData?.categories.find(
          (cat) => cat.qc_afd_id === err.categoryId,
        );
        const subcategory = category?.subcategories.find(
          (sub) => sub.qc_afd_id === err.subcategoryId,
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

    let status: "regular" | "rework" | "correction" = "regular";
    if (qcScore < 80) status = "correction";
    else if (qcScore < 95) status = "rework";

    return { recordCount, tenPercentCount, totalErrors, errorList, status };
  }, [formRows, afdData, qcScore]);

  // ── Data fetching ────────────────────────────────────────────────────────

  const fetchQCFormData = useCallback(async () => {
    if (!trackerData) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch AFD data
      const afdResponse = await fetchAFDList();
      const afdListData = afdResponse.data as AFDApiItem[];
      if (
        afdResponse.status === 200 &&
        Array.isArray(afdListData) &&
        afdListData.length > 0
      ) {
        const afd: AFDApiItem =
          afdListData.find(
            (a: AFDApiItem) => a.categories && a.categories.length > 0,
          ) || afdListData[0]!;

        const transformedAFD: AFDData = {
          afd_id: afd.afd_id,
          afd_name: afd.afd_name,
          categories: (afd.categories ?? []).map((cat: AFDApiCategory) => ({
            qc_afd_id: cat.qc_afd_id,
            name: cat.afd_name,
            points: cat.afd_points,
            subcategories: (cat.subcategories ?? []).map(
              (sub: AFDApiSubcategory) => ({
                qc_afd_id: sub.qc_afd_id,
                name: sub.afd_name,
                points: sub.afd_points,
              }),
            ),
          })),
        };
        setAfdData(transformedAFD);
      }

      // Fetch 10% sample
      if (trackerData.tracker_id && (user?.user_id || user?.id)) {
        const sampleResponse = await generateQCSample(
          trackerData.tracker_id,
          (user?.user_id || user?.id)!,
        );

        if (sampleResponse.success && sampleResponse.data) {
          const sampleResult = sampleResponse.data as {
            sample_data?: SampleRecord[];
            total_records?: number;
            sample_size?: number;
          };
          const sampleData: SampleRecord[] = sampleResult.sample_data || [];
          setFormData(sampleData);
          setTotalRecords(sampleResult.total_records || 0);
          setSampleSize(sampleResult.sample_size || 0);

          const initialRows: FormRow[] = sampleData.map((data, index) => ({
            id: (data.id as string | number) ?? index + 1,
            originalData: data,
            errors: [],
          }));
          setFormRows(initialRows);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Error fetching QC form data:", message);
      setError("Failed to load QC form data");
      toast.error("Failed to load form data");
    } finally {
      setLoading(false);
    }
  }, [trackerData, user]);

  useEffect(() => {
    if (!trackerData) {
      toast.error("No tracker data found");
      navigate({ to: "/dashboard" });
      return;
    }
    fetchQCFormData();
  }, [trackerData, fetchQCFormData, navigate]);

  // ── Score calculations ───────────────────────────────────────────────────

  const calculateRecordScore = useCallback(
    (row: FormRow, afd: AFDData | null) => {
      if (!afd || !afd.categories) return 100;

      const hasFatalError = row.errors.some((err) => {
        const category = afd.categories.find(
          (cat) => cat.qc_afd_id === err.categoryId,
        );
        if (category) {
          const subcategory = category.subcategories.find(
            (sub) => sub.qc_afd_id === err.subcategoryId,
          );
          return subcategory && subcategory.points >= 100;
        }
        return false;
      });

      if (hasFatalError) return 0;

      const categoryScores = afd.categories.map((category) => {
        let categoryScore = 100;
        const categoryErrors = row.errors.filter(
          (e) => e.categoryId === category.qc_afd_id,
        );
        categoryErrors.forEach((e) => {
          const subcategory = category.subcategories.find(
            (sub) => sub.qc_afd_id === e.subcategoryId,
          );
          if (subcategory) categoryScore -= subcategory.points;
        });
        return Math.max(0, categoryScore);
      });

      return categoryScores.length > 0
        ? categoryScores.reduce((sum, score) => sum + score, 0) /
            categoryScores.length
        : 100;
    },
    [],
  );

  const getCategoryScore = useCallback(
    (row: FormRow, categoryId: number) => {
      if (!afdData) return 100;

      const hasFatalError = row.errors.some((err) => {
        const cat = afdData.categories.find(
          (c) => c.qc_afd_id === err.categoryId,
        );
        if (cat) {
          const subcategory = cat.subcategories.find(
            (sub) => sub.qc_afd_id === err.subcategoryId,
          );
          return subcategory && subcategory.points >= 100;
        }
        return false;
      });

      if (hasFatalError) return 0;

      const category = afdData.categories.find(
        (cat) => cat.qc_afd_id === categoryId,
      );
      if (!category) return 100;

      let categoryScore = 100;
      const categoryErrors = row.errors.filter(
        (e) => e.categoryId === categoryId,
      );
      categoryErrors.forEach((e) => {
        const subcategory = category.subcategories.find(
          (sub) => sub.qc_afd_id === e.subcategoryId,
        );
        if (subcategory) categoryScore -= subcategory.points;
      });

      return Math.max(0, categoryScore);
    },
    [afdData],
  );

  useEffect(() => {
    if (!afdData || formRows.length === 0) return;
    const recordScores = formRows.map((row) =>
      calculateRecordScore(row, afdData),
    );
    const avgScore =
      recordScores.reduce((sum, score) => sum + score, 0) / recordScores.length;
    setQcScore(Number(avgScore.toFixed(2)));
  }, [formRows, afdData, calculateRecordScore]);

  // ── Error handlers ───────────────────────────────────────────────────────

  const handleAddError = (
    rowIndex: number,
    categoryId: number,
    subcategoryId: number,
  ) => {
    setFormRows((prev) => {
      const updated = [...prev];
      const row = updated[rowIndex];
      if (!row) return prev;
      if (
        !row.errors.some(
          (e) =>
            e.categoryId === categoryId && e.subcategoryId === subcategoryId,
        )
      ) {
        row.errors = [...row.errors, { categoryId, subcategoryId }];
      }
      return updated;
    });
  };

  const handleRemoveError = (rowIndex: number, errorIndex: number) => {
    setFormRows((prev) => {
      const updated = [...prev];
      const existing = updated[rowIndex];
      if (!existing) return prev;
      const row: FormRow = {
        id: existing.id,
        originalData: existing.originalData,
        errors: existing.errors.filter((_, idx) => idx !== errorIndex),
      };
      updated[rowIndex] = row;
      return updated;
    });
  };

  // ── Submission ───────────────────────────────────────────────────────────

  const handleConfirmSubmission = async (comments: string) => {
    try {
      setSaving(true);
      if (!trackerData) throw new Error("Missing tracker data");

      const errorList: QCErrorEntry[] = [];
      formRows.forEach((row, rowIndex) => {
        row.errors.forEach((err) => {
          const category = afdData?.categories.find(
            (cat) => cat.qc_afd_id === err.categoryId,
          );
          const subcategory = category?.subcategories.find(
            (sub) => sub.qc_afd_id === err.subcategoryId,
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

      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0];

      const payload = {
        logged_in_user_id: user?.user_id || user?.id,
        tracker_id: trackerData.tracker_id,
        qc_user_id: user?.user_id || user?.id,
        agent_user_id:
          trackerData.user_id ||
          trackerData.agent_user_id ||
          trackerData.agent_id,
        project_id: trackerData.project_id,
        task_id: trackerData.task_id,
        file_path: trackerData.tracker_file || trackerData.file_path || "",
        date_of_file_submission: formattedDate,
        qc_score: parseFloat(qcScore.toFixed(2)),
        status: errorMetrics.status,
        file_record_count: totalRecords || errorMetrics.recordCount,
        data_generated_count: sampleSize || errorMetrics.tenPercentCount,
        qc_file_records: formData,
        error_score: parseFloat((100 - qcScore).toFixed(2)),
        error_list: errorList,
        comments: comments || "",
      };

      const response = await saveQCRecord(payload);
      if (response.success || response.status === 200) {
        toast.success("QC Form submitted successfully!");
        setShowConfirmModal(false);
        navigate({ to: "/dashboard" });
      } else {
        throw new Error(response.message || "Failed to save QC record");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to submit QC form";
      console.error("Error submitting form:", message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    if (trackerData?.tracker_id) {
      const backendUrl = config.apiQcUrl;
      const fileUrl = `${backendUrl}/qc-records/download-sample/${trackerData.tracker_id}?logged_in_user_id=${user?.user_id || user?.id}`;
      window.open(fileUrl, "_blank");
      toast.success("Downloading sample file...");
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading)
    return (
      <div className="p-12 text-center">
        <Loading />
      </div>
    );
  if (error)
    return (
      <div className="p-6">
        <ErrorMessage message={error} />
      </div>
    );

  const firstRecord = formData[0];
  const dynamicKeys = firstRecord
    ? Object.keys(firstRecord)
        .filter((k) => k !== "id")
        .slice(0, 3)
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: "/dashboard" })}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Button>
      </div>

      <div className="bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 shadow-lg text-white">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <ClipboardCheck className="w-8 h-8" /> Quality Control Form
        </h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
            <User />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Agent</p>
            <p className="font-bold text-slate-800">{trackerData?.user_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <FolderOpen />
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-slate-400 uppercase">
              Project
            </p>
            <p className="font-bold text-slate-800 truncate">
              {trackerData?.project_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={handleDownload}
            variant="outline"
            className="w-full gap-2 border-2 border-emerald-100 hover:bg-emerald-50 text-emerald-700"
          >
            <Download className="w-4 h-4" /> Download Sample File
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">
                  Sr.
                </th>
                {dynamicKeys.map((k) => (
                  <th
                    key={k}
                    className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase"
                  >
                    {k.replace(/_/g, " ")}
                  </th>
                ))}
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase w-64">
                  Select Error
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">
                  Errors
                </th>
                {afdData?.categories.map((cat) => (
                  <th
                    key={cat.qc_afd_id}
                    className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center"
                  >
                    {cat.name}
                  </th>
                ))}
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">
                  Score
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {formRows.map((row, idx) => (
                <tr key={row.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-4 text-sm font-bold text-slate-400">
                    {idx + 1}
                  </td>
                  {dynamicKeys.map((k) => (
                    <td key={k} className="px-4 py-4 text-sm text-slate-600">
                      {String(row.originalData[k] ?? "")}
                    </td>
                  ))}
                  <td className="px-4 py-4 min-w-[200px]">
                    <div className="space-y-2">
                      <SearchableSelect
                        value={pendingSelections[row.id]?.category || ""}
                        onChange={(val) =>
                          setPendingSelections((prev) => ({
                            ...prev,
                            [row.id]: {
                              category: String(val),
                              subcategories: [],
                            },
                          }))
                        }
                        options={
                          afdData?.categories.map((c) => ({
                            value: c.qc_afd_id,
                            label: c.name,
                          })) || []
                        }
                        placeholder="Select Error"
                        className="h-9"
                      />
                      {(() => {
                        const pendingRow = pendingSelections[row.id];
                        if (!pendingRow?.category) return null;
                        return (
                          <div className="flex gap-1">
                            <MultiSelectWithCheckbox
                              value={pendingRow.subcategories || []}
                              onChange={(val) =>
                                setPendingSelections((prev) => {
                                  const current = prev[row.id];
                                  if (!current) return prev;
                                  const updatedSelection: PendingSelection = {
                                    ...current,
                                    subcategories: val as (string | number)[],
                                  };
                                  return {
                                    ...prev,
                                    [row.id]: updatedSelection,
                                  };
                                })
                              }
                              options={
                                afdData?.categories
                                  .find(
                                    (c) =>
                                      c.qc_afd_id ===
                                      Number(pendingRow.category),
                                  )
                                  ?.subcategories.map((s) => ({
                                    value: s.qc_afd_id,
                                    label: `${s.name} (-${s.points})`,
                                  })) || []
                              }
                              placeholder="Select Subcategories"
                              className="h-9 flex-1"
                            />
                            <Button
                              size="sm"
                              disabled={!pendingRow.subcategories?.length}
                              onClick={() => {
                                pendingRow.subcategories.forEach((sid) =>
                                  handleAddError(
                                    idx,
                                    Number(pendingRow.category),
                                    Number(sid),
                                  ),
                                );
                                setPendingSelections((prev) => {
                                  const n = { ...prev };
                                  delete n[row.id];
                                  return n;
                                });
                              }}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                      {row.errors.map((err, eIdx) => (
                        <div
                          key={eIdx}
                          className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-red-100"
                        >
                          {
                            afdData?.categories
                              .find((c) => c.qc_afd_id === err.categoryId)
                              ?.subcategories.find(
                                (s) => s.qc_afd_id === err.subcategoryId,
                              )?.name
                          }
                          <button onClick={() => handleRemoveError(idx, eIdx)}>
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </td>
                  {afdData?.categories.map((cat) => (
                    <td key={cat.qc_afd_id} className="px-4 py-4 text-center">
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded",
                          getCategoryScore(row, cat.qc_afd_id) === 100
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700",
                        )}
                      >
                        {getCategoryScore(row, cat.qc_afd_id)}%
                      </span>
                    </td>
                  ))}
                  <td className="px-4 py-4 text-center">
                    <span
                      className={cn(
                        "text-sm font-bold",
                        calculateRecordScore(row, afdData) >= 95
                          ? "text-green-600"
                          : "text-red-600",
                      )}
                    >
                      {calculateRecordScore(row, afdData).toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">
              Final Score
            </p>
            <p
              className={cn(
                "text-4xl font-bold",
                qcScore >= 95 ? "text-green-400" : "text-red-400",
              )}
            >
              {qcScore}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">
              Errors
            </p>
            <p className="text-4xl font-bold text-red-400">
              {errorMetrics.totalErrors}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">
              Status
            </p>
            <div
              className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase mt-2",
                errorMetrics.status === "regular"
                  ? "bg-green-500/20 text-green-400"
                  : errorMetrics.status === "rework"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-red-500/20 text-red-400",
              )}
            >
              {errorMetrics.status}
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="bg-transparent text-white border-white/20 hover:bg-white/10"
            onClick={() => navigate({ to: "/dashboard" })}
          >
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 px-8"
            onClick={() => setShowConfirmModal(true)}
          >
            Submit QC
          </Button>
        </div>
      </div>

      <QCConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSubmission}
        loading={saving}
        data={{
          qaName: user?.user_name || user?.name || "N/A",
          agentEmail: trackerData?.user_email || trackerData?.email || "N/A",
          projectName: trackerData?.project_name || "N/A",
          taskName: trackerData?.task_name || "N/A",
          status: errorMetrics.status,
          qcScore: qcScore,
          errorCount: errorMetrics.totalErrors,
          errorList: errorMetrics.errorList,
        }}
      />
    </div>
  );
};

export default QCForm;
