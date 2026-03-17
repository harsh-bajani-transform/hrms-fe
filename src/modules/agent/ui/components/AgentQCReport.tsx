import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { toast } from "sonner";
import {
  fetchQCRecords,
  fetchReworkTrackers,
  addReworkFile,
} from "../../services/agentService";
import {
  RotateCcw,
  Award,
  CheckCircle2,
  AlertCircle,
  Upload,
  File,
} from "lucide-react";
import { getFriendlyErrorMessage } from "../../../../utils/errorMessages";
import ErrorMessage from "../../../../components/common/ErrorMessage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { createQCReportColumns, type QCRecord } from "./AgentQCReportColumns";
import dayjs from "dayjs";

const AgentQCReport = () => {
  const { user } = useAuth();

  // State management
  const [startDate, setStartDate] = useState(() =>
    dayjs().format("YYYY-MM-DD"),
  );
  const [endDate, setEndDate] = useState(() => dayjs().format("YYYY-MM-DD"));
  const [allQcData, setAllQcData] = useState<QCRecord[]>([]);
  const [reworkFiles, setReworkFiles] = useState<Record<string, string>>({}); // Map of tracker_id -> rework_file_path
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorListModal, setShowErrorListModal] = useState(false);
  const [selectedErrorList, setSelectedErrorList] = useState<any[]>([]);
  const [selectedRecordInfo, setSelectedRecordInfo] = useState<{
    qaAgent: string;
    projectTask: string;
    evalDate: string;
    status: string;
    qcId: string | number;
    trackerId: string | number;
    reworkFilePath: string | null;
  } | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [submittingRework, setSubmittingRework] = useState(false);

  // Fetch QC report data
  const loadQCData = useCallback(async () => {
    if (!user?.user_id) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetchQCRecords(user.user_id);
      const records = response?.data || [];
      const mappedData: QCRecord[] = records.map((record: any) => ({
        qc_id: record.id,
        tracker_id: record.tracker_id,
        evaluation_datetime: record.timestamp,
        qa_agent: record.qa_name || "-",
        project_task: `${record.project_name || "-"} / ${record.task_name || "-"}`,
        project_name: record.project_name,
        task_name: record.task_name,
        file_name: record.file_path,
        total_records: record.file_record_count,
        error_list: record.error_list,
        status: record.status,
        qc_score: record.qc_score,
      }));

      setAllQcData(mappedData);

      // Fetch rework file data from Python API
      try {
        const reworkResponse = await fetchReworkTrackers(user.user_id);
        const reworkRecords = reworkResponse?.data?.records || [];
        const reworkFileMap: Record<string, string> = {};

        reworkRecords.forEach((reworkRecord: any) => {
          if (
            reworkRecord.rework_file_path &&
            reworkRecord.rework_file_path.trim()
          ) {
            const matchingQcRecord = mappedData.find((qcRecord) => {
              const projectMatch =
                qcRecord.project_name === reworkRecord.project_name;
              const taskMatch = qcRecord.task_name === reworkRecord.task_name;
              const qcTime = dayjs(qcRecord.evaluation_datetime).unix();
              const reworkTime = dayjs(reworkRecord.evaluation_datetime).unix();
              const timeDiff = Math.abs(qcTime - reworkTime);
              return projectMatch && taskMatch && timeDiff < 21600; // 6 hours
            });

            if (matchingQcRecord) {
              reworkFileMap[matchingQcRecord.tracker_id] =
                reworkRecord.rework_file_path;
            }
          }
        });

        setReworkFiles(reworkFileMap);
      } catch (reworkErr) {
        console.error("[AgentQCReport] Error fetching rework data:", reworkErr);
      }
    } catch (err: unknown) {
      console.error("[AgentQCReport] Error fetching QC data:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(getFriendlyErrorMessage(msg));
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    void loadQCData();
  }, [loadQCData]);

  // Filter data by date range on frontend
  const qcData = useMemo(() => {
    if (!startDate || !endDate) return allQcData;

    return allQcData.filter((record) => {
      if (!record.evaluation_datetime) return false;

      const recordDate = dayjs(record.evaluation_datetime).startOf("day");
      const start = dayjs(startDate).startOf("day");
      const end = dayjs(endDate).startOf("day");

      return (
        (recordDate.isAfter(start) || recordDate.isSame(start)) &&
        (recordDate.isBefore(end) || recordDate.isSame(end))
      );
    });
  }, [allQcData, startDate, endDate]);

  // Handle Rework/Correction Modal
  const handleOpenReworkModal = useCallback(
    (
      errorList: any,
      recordInfo: {
        qaAgent: string;
        projectTask: string;
        evalDate: string;
        trackerId: string | number;
      },
      status: string,
      qcId: string | number,
      trackerId: string | number,
    ) => {
      let parsedErrorList = [];
      try {
        if (typeof errorList === "string") {
          parsedErrorList = JSON.parse(errorList);
        } else if (Array.isArray(errorList)) {
          parsedErrorList = errorList;
        }
      } catch (e) {
        console.error("[AgentQCReport] Error parsing error list:", e);
      }

      const reworkFilePath = reworkFiles[trackerId] || null;
      setSelectedErrorList(parsedErrorList);
      setSelectedRecordInfo({
        ...recordInfo,
        status,
        qcId,
        trackerId,
        reworkFilePath,
      });
      setShowErrorListModal(true);
    },
    [reworkFiles],
  );

  const handleCloseErrorListModal = () => {
    setShowErrorListModal(false);
    setSelectedErrorList([]);
    setSelectedRecordInfo(null);
    setUploadedFile(null);
    setFilePreview(null);
    setUploadError("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError("File size must be less than 10MB");
      return;
    }
    setUploadedFile(file);
    setFilePreview(file.name);
    setUploadError("");
  };

  const handleSubmitRework = async () => {
    if (!uploadedFile || !selectedRecordInfo?.trackerId) return;
    setSubmittingRework(true);
    try {
      const formData = new FormData();
      formData.append("tracker_id", String(selectedRecordInfo.trackerId));
      formData.append("rework_file_path", uploadedFile);
      await addReworkFile(formData);
      toast.success("Rework file uploaded successfully!");
      handleCloseErrorListModal();
      void loadQCData(); // Refresh
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(getFriendlyErrorMessage(msg));
    } finally {
      setSubmittingRework(false);
    }
  };

  const columns = useMemo(
    () => createQCReportColumns(handleOpenReworkModal, reworkFiles),
    [handleOpenReworkModal, reworkFiles],
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">From</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">To</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setStartDate(dayjs().format("YYYY-MM-DD"));
                setEndDate(dayjs().format("YYYY-MM-DD"));
              }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Loading QC report...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <ErrorMessage message={error} />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={qcData}
            loading={false}
            emptyMessage="No QC evaluations found for this period."
            emptyIcon={Award}
            showPagination={true}
            pageSize={10}
            containerClassName="border-0"
            headerClassName="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-bold text-xs"
            rowClassName="group"
            rowHoverClassName="hover:bg-slate-50 transition-colors"
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-blue-700 uppercase mb-1">
              Average QC Score
            </p>
            <p className="text-3xl font-black text-slate-900">
              {qcData.length > 0
                ? `${(qcData.reduce((sum, r) => sum + (Number(r.qc_score) || 0), 0) / qcData.length).toFixed(2)}%`
                : "0.00%"}
            </p>
          </div>
          <Award className="w-12 h-12 text-blue-200" />
        </div>
        <div className="bg-linear-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-700 uppercase mb-1">
              Total Evaluated
            </p>
            <p className="text-3xl font-black text-slate-900">
              {qcData.length}
            </p>
          </div>
          <CheckCircle2 className="w-12 h-12 text-slate-200" />
        </div>
      </div>

      <Dialog
        open={showErrorListModal}
        onOpenChange={(open) => !open && handleCloseErrorListModal()}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Error List & Feedback
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {selectedRecordInfo && (
              <div className="bg-slate-50 p-4 rounded-lg flex flex-wrap gap-x-6 gap-y-2 text-sm border border-slate-200">
                <div>
                  <span className="text-slate-500">QA:</span>{" "}
                  <span className="font-bold">{selectedRecordInfo.qaAgent}</span>
                </div>
                <div>
                  <span className="text-slate-500">Project:</span>{" "}
                  <span className="font-bold">
                    {selectedRecordInfo.projectTask}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {selectedErrorList.map((err, i) => (
                <div
                  key={i}
                  className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-800 flex items-start gap-2"
                >
                  <span className="bg-red-200 text-red-800 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <div className="font-medium">
                    {typeof err === "string" ? err : JSON.stringify(err)}
                  </div>
                </div>
              ))}
              {selectedErrorList.length === 0 && (
                <div className="text-center py-6 text-slate-400">
                  No specific errors listed.
                </div>
              )}
            </div>

            {(selectedRecordInfo?.status?.toLowerCase() === "rework" ||
              selectedRecordInfo?.status?.toLowerCase() === "correction") && (
              <div className="pt-4 border-t border-slate-100">
                {selectedRecordInfo.reworkFilePath ? (
                  <div className="bg-green-50 border border-green-100 p-4 rounded-lg">
                    <p className="text-green-800 text-sm font-bold flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4" /> Corrected File
                      Uploaded
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-700 bg-white"
                      asChild
                    >
                      <a
                        href={selectedRecordInfo.reworkFilePath}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Upload className="w-4 h-4 mr-2" /> Download
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div
                      role="button"
                      tabIndex={0}
                      className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() =>
                        document.getElementById("rework-upload")?.click()
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          document.getElementById("rework-upload")?.click();
                        }
                      }}
                    >
                      <input
                        id="rework-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      {filePreview ? (
                        <div className="flex items-center justify-center gap-2 text-blue-600 font-bold">
                          <File className="w-5 h-5" /> {filePreview}
                        </div>
                      ) : (
                        <div className="text-slate-500">
                          <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-bold">Upload Fixed File</p>
                          <p className="text-xs">Max 10MB</p>
                        </div>
                      )}
                    </div>
                    {uploadError && (
                      <p className="text-xs text-red-500 font-bold">
                        {uploadError}
                      </p>
                    )}
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
                      disabled={!uploadedFile || submittingRework}
                      onClick={handleSubmitRework}
                    >
                      {submittingRework ? "Uploading..." : "Submit Rework"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentQCReport;
