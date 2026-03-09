import React, { useState } from 'react';
import { X, User, Mail, FolderOpen, Briefcase, Award, XCircle, ListChecks, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
  submissionType?: 'regular' | 'rework' | 'correction' | '';
  loading?: boolean;
}

const QCConfirmationModal: React.FC<QCConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  data = {}, 
  loading = false 
}) => {
  const [comments, setComments] = useState('');
  
  const {
    qaName = 'N/A',
    agentEmail = 'N/A',
    projectName = 'N/A',
    taskName = 'N/A',
    status = 'Regular',
    qcScore = 0,
    errorCount = 0,
    errorList = []
  } = data;

  const handleSubmit = () => {
    onConfirm(comments);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
        {/* Header */}
        <DialogHeader className="bg-linear-to-r from-blue-600 to-indigo-600 p-6 flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-2xl font-bold text-white tracking-tight">Confirm QC Submission</DialogTitle>
              <p className="text-blue-100 text-sm font-medium opacity-90 leading-relaxed">Please review the details before finalizing your submission</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={loading}
            className="text-white hover:bg-white/20 hover:text-white rounded-xl transition-all h-10 w-10 shrink-0"
          >
            <X className="w-6 h-6" />
          </Button>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar bg-slate-50/30">
          {/* QA & Project Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* QA Information */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm space-y-5">
              <h3 className="text-xs font-bold text-blue-700 uppercase tracking-widest flex items-center gap-2 mb-2">
                <User className="size-4" />
                QA Information
              </h3>
              <div className="space-y-4">
                <div className="bg-blue-50/40 rounded-xl p-4 border border-blue-100/50 transition-all hover:border-blue-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">QA Agent</p>
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    {qaName}
                  </p>
                </div>
                <div className="bg-blue-50/40 rounded-xl p-4 border border-blue-100/50 transition-all hover:border-blue-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Agent Email</p>
                  <p className="text-sm font-bold text-blue-700 break-all flex items-center gap-2">
                    <Mail className="size-3.5 opacity-70" />
                    {agentEmail}
                  </p>
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm space-y-5">
              <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-widest flex items-center gap-2 mb-2">
                <FolderOpen className="size-4" />
                Project Details
              </h3>
              <div className="space-y-4">
                <div className="bg-indigo-50/40 rounded-xl p-4 border border-indigo-100/50 transition-all hover:border-indigo-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Project Name</p>
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Briefcase className="size-3.5 text-indigo-500 opacity-70" />
                    {projectName}
                  </p>
                </div>
                <div className="bg-indigo-50/40 rounded-xl p-4 border border-indigo-100/50 transition-all hover:border-indigo-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Task Category</p>
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <ListChecks className="size-3.5 text-indigo-500 opacity-70" />
                    {taskName}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Scores & Status Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Evaluation Status */}
             <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm space-y-5">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <Award className="size-4 text-orange-500" />
                  Evaluation Metrics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 flex flex-col items-center text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Submission Status</p>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap",
                      status.toLowerCase() === 'regular' ? 'bg-green-100/80 text-green-700 border-green-200' : 
                      status.toLowerCase() === 'rework' ? 'bg-yellow-100/80 text-yellow-700 border-yellow-200' : 
                      'bg-red-100/80 text-red-700 border-red-200'
                    )}>
                      {status}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 flex flex-col items-center text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Quality Score</p>
                    <p className={cn(
                      "text-2xl font-black tabular-nums tracking-tighter",
                      qcScore >= 95 ? "text-green-600" : qcScore >= 80 ? "text-yellow-600" : "text-red-600"
                    )}>
                      {qcScore.toFixed(1)}%
                    </p>
                  </div>
                </div>
             </div>

             {/* Error Summary */}
             <div className="bg-red-50/30 rounded-2xl p-6 border border-red-100/60 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-red-800 uppercase tracking-widest flex items-center gap-2 mb-2">
                <AlertCircle className="size-4" />
                Accuracy Summary
              </h3>
              <div className="bg-white rounded-xl p-4 border border-red-100/50 flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Discrepancies</p>
                  <p className="text-xs font-medium text-slate-500">Errors identified in this audit</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center border border-red-200 shadow-inner">
                  <p className="text-2xl font-black text-red-600 tabular-nums leading-none">{errorCount}</p>
                </div>
              </div>
              {errorList.length > 0 && (
                <div className="max-h-24 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {errorList.map((error, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-white/80 rounded-lg border border-red-100/40 hover:border-red-200/60 transition-colors">
                      <span className="text-[10px] font-bold text-slate-700 truncate mr-3">{error.name}</span>
                      <span className="text-[11px] font-black text-red-600 bg-red-50/50 px-2 py-0.5 rounded-md border border-red-100">{error.count}</span>
                    </div>
                  ))}
                </div>
              )}
             </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <MessageSquare className="size-4 text-purple-600" />
              Evaluation Comments <span className="text-red-600">*</span>
            </h3>
            <div className="relative group">
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Please provide comprehensive justification for this QC score and detailed feedback for the agent..."
                rows={4}
                className="w-full p-6 text-sm text-slate-700 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all shadow-sm placeholder:text-slate-400 resize-none group-hover:border-slate-300"
              />
              <div className="absolute bottom-4 right-6 flex items-center gap-4">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  comments.length < 10 ? "text-slate-300" : "text-green-500"
                )}>
                  {comments.length} CHR
                </span>
                {!comments.trim() && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-500 rounded-md border border-red-100 animate-pulse">
                    <AlertCircle className="size-3" />
                    <span className="text-[9px] font-black uppercase">REQUIRED</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="bg-slate-50/80 p-6 flex flex-row items-center justify-end gap-4 border-t border-slate-200/60 backdrop-blur-sm sticky bottom-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="font-bold border-2 border-slate-200 hover:bg-slate-100 rounded-xl px-6 h-12 transition-all active:scale-95"
          >
            Go Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !comments.trim()}
            className="px-10 h-12 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-black rounded-xl transition-all shadow-xl hover:shadow-blue-500/20 active:scale-95 flex items-center gap-3 overflow-hidden"
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              <>
                <CheckCircle2 className="size-5" />
                Finalize & Submit Audit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QCConfirmationModal;
