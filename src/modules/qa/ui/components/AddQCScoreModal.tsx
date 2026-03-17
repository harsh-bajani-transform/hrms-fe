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
import { Award, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { qcApi } from "../../../../services/api";

interface AddQCScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  qaAgentId: string | number;
  qaAgentName: string;
  month: string;
}

const AddQCScoreModal: React.FC<AddQCScoreModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  qaAgentId,
  qaAgentName,
  month,
}) => {
  const [qcScore, setQcScore] = useState<string>("");
  const [errorScore, setErrorScore] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!qcScore || !errorScore) {
      toast.error("Please fill in both scores");
      return;
    }

    setLoading(true);
    try {
      await qcApi.post("/qa-agent-audit/add-score", {
        qa_agent_id: qaAgentId,
        month_year: month,
        average_qc_score: Number(qcScore),
        error_score: Number(errorScore),
      });

      toast.success("QC Score updated successfully");
      onSuccess();
      onClose();
      // Reset form
      setQcScore("");
      setErrorScore("");
    } catch (error) {
      console.error("Error adding QC score:", error);
      toast.error("Failed to update QC score");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Add QC Score for {qaAgentName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qcScore" className="text-xs font-bold uppercase text-slate-500">
                QC Score (%)
              </Label>
              <Input
                id="qcScore"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="e.g. 98.5"
                value={qcScore}
                onChange={(e) => setQcScore(e.target.value)}
                className="bg-slate-50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="errorScore" className="text-xs font-bold uppercase text-slate-500">
                Error Score
              </Label>
              <Input
                id="errorScore"
                type="number"
                placeholder="e.g. 2"
                value={errorScore}
                onChange={(e) => setErrorScore(e.target.value)}
                className="bg-slate-50"
                required
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg flex gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Adding a manual score will overwrite any automatically calculated average for the 
              month of <strong>{month}</strong> for this QA agent.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 font-bold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Score"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddQCScoreModal;
