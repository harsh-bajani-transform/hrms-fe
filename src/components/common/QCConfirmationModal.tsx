import React, { useState } from "react";
import {
  X,
  User,
  Mail,
  FolderOpen,
  Briefcase,
  Award,
  AlertCircle,
  ListChecks,
  CheckCircle2,
  MessageSquare,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "../ui/textarea";

export interface QCConfirmationData {
  qaName: string;
  agentEmail: string;
  projectName: string;
  taskName: string;
  status: string;
  qcScore: number;
  errorCount: number;
  errorList: { name: string; count: number }[];
}

interface QCConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comments: string) => void;
  data: Partial<QCConfirmationData>;
  submissionType?: "regular" | "rework" | "correction" | "";
  loading?: boolean;
}

const QCConfirmationModal: React.FC<QCConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  data = {},
  loading = false,
}) => {
  const [comments, setComments] = useState("");

  const {
    qaName = "N/A",
    agentEmail = "N/A",
    projectName = "N/A",
    taskName = "N/A",
    status = "Regular",
    qcScore = 0,
    errorCount = 0,
    errorList = [],
  } = data;

  const statusLower = status.toLowerCase();
  const statusColor =
    statusLower === "regular"
      ? "bg-green-100 text-green-700 border-green-200"
      : statusLower === "rework"
        ? "bg-yellow-100 text-yellow-700 border-yellow-200"
        : "bg-red-100 text-red-700 border-red-200";

  const scoreColor =
    qcScore >= 95
      ? "text-green-600"
      : qcScore >= 80
        ? "text-yellow-600"
        : "text-red-600";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full p-0 overflow-hidden rounded-2xl border-none shadow-2xl gap-0">
        {/* ── Header ── */}
        <div className="bg-blue-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                Confirm QC Submission
              </h2>
              <p className="text-blue-100 text-xs font-medium">
                Review details before finalizing
              </p>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto max-h-[65vh] bg-slate-50 p-6 space-y-4">
          {/* Row 1 — Info cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* QA Info */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <User className="w-3 h-3" /> QA Information
              </p>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    QA Agent
                  </p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">
                    {qaName}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Agent Email
                  </p>
                  <p className="text-sm font-bold text-blue-600 mt-0.5 break-all">
                    {agentEmail}
                  </p>
                </div>
              </div>
            </div>

            {/* Project Info */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <FolderOpen className="w-3 h-3" /> Project Details
              </p>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Project Name
                  </p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    {projectName}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Task
                  </p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                    <ListChecks className="w-3.5 h-3.5 text-slate-400" />
                    {taskName}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2 — Score & Errors */}
          <div className="grid grid-cols-3 gap-4">
            {/* QC Score */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-center text-center">
              <Award className={cn("w-6 h-6 mb-1", scoreColor)} />
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                QC Score
              </p>
              <p className={cn("text-3xl font-black tabular-nums", scoreColor)}>
                {qcScore.toFixed(1)}%
              </p>
            </div>

            {/* Status */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-center text-center">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">
                Status
              </p>
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                  statusColor,
                )}
              >
                {status}
              </span>
            </div>

            {/* Error Count */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-6 h-6 text-red-500 mb-1" />
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                Total Errors
              </p>
              <p className="text-3xl font-black text-red-600 tabular-nums">
                {errorCount}
              </p>
            </div>
          </div>

          {/* Error Breakdown (only if errors exist) */}
          {errorList.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <ListChecks className="w-3 h-3" /> Error Breakdown
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {errorList.map((error, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 bg-red-50 rounded-lg border border-red-100"
                  >
                    <span className="text-xs font-semibold text-slate-700 truncate mr-3">
                      {error.name}
                    </span>
                    <span className="text-xs font-black text-red-600 shrink-0">
                      {error.count} error{error.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" /> Comments{" "}
              <span className="text-red-500">*</span>
            </p>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Provide feedback and justification for this QC score..."
              rows={3}
              className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500 focus:bg-white transition-all resize-none placeholder:text-slate-400"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-medium">
                {comments.length} characters
              </span>
              {!comments.trim() && (
                <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
                  Required
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="bg-white px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="font-bold border-slate-200 hover:bg-slate-50 rounded px-5 h-10"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(comments)}
            disabled={loading || !comments.trim()}
            className="px-6 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded flex items-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Finalize & Submit
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QCConfirmationModal;
