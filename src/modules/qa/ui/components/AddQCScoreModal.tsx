import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Award, FileCheck, FileText, Loader2, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import api from "../../../../services/api";
import { AuditRecord } from "../../types";

interface AddQCScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedRecord: AuditRecord | null;
}

const AddQCScoreModal: React.FC<AddQCScoreModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedRecord,
}) => {
  const [qcScore, setQcScore] = useState<string>("");
  const [qcCheckedFile, setQcCheckedFile] = useState<File | null>(null);
  const [errorNotes, setErrorNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!qcScore || isNaN(Number(qcScore))) {
      toast.error("Please enter a valid QC Score");
      return;
    }

    const score = Number(qcScore);
    if (score < 0 || score > 100) {
      toast.error("QC Score must be between 0 and 100");
      return;
    }

    if (!selectedRecord || !selectedRecord.audit_id) {
      toast.error("Internal Error: No record selected");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('qc_record_id', selectedRecord.audit_id.toString());
      formData.append('qc_score', score.toString());
      
      if (qcCheckedFile) {
        formData.append('qc_checked_file', qcCheckedFile);
      }
      
      if (errorNotes.trim()) {
        formData.append('error_notes', errorNotes.trim());
      }

      // Submit to Python backend
      const response = await api.post('/qc_audit/add', formData);

      if (response.data.success || response.status === 200 || response.status === 201) {
        toast.success(`QC Score ${score}% submitted successfully!`);
        onSuccess();
        onClose();
        // Reset form
        setQcScore("");
        setQcCheckedFile(null);
        setErrorNotes("");
      } else {
        toast.error(response.data.message || "Failed to submit QC Score");
      }
    } catch (error: any) {
      console.error("Error submitting QC Score:", error);
      toast.error(error.response?.data?.message || "Failed to submit QC Score");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setQcCheckedFile(e.target.files[0]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-2 border-blue-200">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white space-y-0 text-left">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Award className="w-5 h-5" />
                Add QC Score
              </DialogTitle>
              {selectedRecord && (
                <div className="text-blue-100 text-xs font-medium">
                  <span className="opacity-75">Agent:</span> {selectedRecord.agent_name} | 
                  <span className="opacity-75 ml-1">Project:</span> {selectedRecord.project_name}
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="qcScore" className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-blue-600" />
              QC Score (%)
            </Label>
            <Input
              id="qcScore"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="Enter QC Score (0-100)"
              value={qcScore}
              onChange={(e) => setQcScore(e.target.value)}
              className="h-11 bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qcFile" className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-blue-600" />
              QC Checked File
            </Label>
            <Input
              id="qcFile"
              type="file"
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv,.pdf,.doc,.docx"
              className="h-11 bg-slate-50 border-slate-200 file:bg-blue-50 file:text-blue-700 file:border-0 file:rounded-lg file:px-3 file:mr-3 cursor-pointer rounded-xl"
            />
            {qcCheckedFile && (
               <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                <FileCheck className="w-3 h-3" />
                {qcCheckedFile.name} ({(qcCheckedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="errorNotes" className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              Error Notes
            </Label>
            <Textarea
              id="errorNotes"
              placeholder="Enter Error Notes (Optional)"
              value={errorNotes}
              onChange={(e) => setErrorNotes(e.target.value)}
              className="bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl resize-none min-h-[80px]"
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 rounded-xl font-bold border-slate-200 text-slate-600"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-lg shadow-blue-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Score"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddQCScoreModal;
