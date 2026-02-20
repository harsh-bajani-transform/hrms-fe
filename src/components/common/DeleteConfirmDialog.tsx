import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Main heading, e.g. "Delete Category" */
  title: string;
  /** Supporting description shown below the title */
  description: string;
  /** Called when the user confirms deletion */
  onConfirm: () => void | Promise<void>;
  /** Label for the confirm button (default: "Delete") */
  confirmLabel?: string;
  /** Whether a delete operation is in progress */
  loading?: boolean;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel = "Delete",
  loading = false,
}) => {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmDialog;
