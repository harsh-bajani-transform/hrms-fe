import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ErrorListModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: string[];
}

const ErrorListModal: React.FC<ErrorListModalProps> = ({
  isOpen,
  onClose,
  errors,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="w-5 h-5" />
            QC Error List
          </DialogTitle>
        </DialogHeader>

        {errors.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>No errors recorded for this record.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] pr-4">
            <ul className="space-y-3 py-2">
              {errors.map((error, idx) => (
                <li
                  key={idx}
                  className="flex gap-3 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700 animate-in fade-in slide-in-from-top-1"
                >
                  <span className="shrink-0 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <div className="flex-1 leading-relaxed">{error}</div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ErrorListModal;
