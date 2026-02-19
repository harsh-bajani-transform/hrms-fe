import React, { useState, useEffect } from "react";
import { Save, Calendar, Clock, Award } from "lucide-react";
import { toast } from "sonner";
import { saveTempQC, TempQCPayload } from "../../modules/qa/services/qcService";
import { useAuth } from "../../context/AuthContext";
import { reformatDateForBackend } from "../../lib/utils/dateUtils";
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

interface UserInfo {
  user_id?: string | number;
  user_name?: string;
  name?: string;
  team_name?: string;
}

interface DailyEntryFormData {
  assignHours: string;
  qcScore: string;
}

interface DailyEntryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DailyEntryFormData) => void;
  initialData?: {
    assignHours?: string | number;
    qcScore?: string | number;
  } | null;
  isEditMode?: boolean;
  user?: UserInfo | null;
  userId?: string | number | null;
  date?: string | null;
}

const DailyEntryFormModal: React.FC<DailyEntryFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isEditMode = false,
  user: targetUser = null,
  userId,
  date,
}) => {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    assignHours: "",
    qcScore: "",
  });

  const [errors, setErrors] = useState<{
    assignHours?: string;
    qcScore?: string;
  }>({});
  const [touched, setTouched] = useState<{
    assignHours?: boolean;
    qcScore?: boolean;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialData) {
        const parseNumericValue = (
          value: string | number | undefined | null,
        ) => {
          if (
            value === null ||
            value === undefined ||
            value === "" ||
            value === "-"
          ) {
            return "";
          }
          const num = Number(value);
          return isNaN(num) ? "" : String(value);
        };

        setFormData({
          assignHours: parseNumericValue(initialData.assignHours),
          qcScore: parseNumericValue(initialData.qcScore),
        });
      } else {
        setFormData({
          assignHours: "",
          qcScore: "",
        });
      }
      setErrors({});
      setTouched({});
    }
  }, [isOpen, isEditMode, initialData]);

  const validateField = (name: string, value: string) => {
    switch (name) {
      case "assignHours":
        if (value && value !== "") {
          const hours = Number(value);
          if (isNaN(hours) || hours < 0) return "Must be a non-negative number";
          if (hours > 24) return "Cannot exceed 24 hours";
        }
        return "";
      case "qcScore":
        if (value && value !== "") {
          const score = Number(value);
          if (isNaN(score) || score < 0) return "Must be a non-negative number";
          if (score > 100) return "Cannot exceed 100";
        }
        return "";
      default:
        return "";
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { assignHours?: string; qcScore?: string } = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) newErrors[key as keyof typeof newErrors] = error;
    });

    setErrors(newErrors);
    setTouched({ assignHours: true, qcScore: true });

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      try {
        const formattedDate = reformatDateForBackend(date);

        if (!formattedDate || !/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
          toast.error(
            `Invalid date record: "${date || "missing"}". Please check the report data.`,
          );
          setIsSubmitting(false);
          return;
        }

        const payload: TempQCPayload = {
          user_id: userId || "",
          date: formattedDate,
        };

        if (formData.assignHours !== "")
          payload.assigned_hours = Number(formData.assignHours);
        if (formData.qcScore !== "")
          payload.qc_score = Number(formData.qcScore);

        const response = await saveTempQC(payload);

        if (response.status) {
          toast.success(response.message || "QC saved successfully!");
          onSubmit(formData);
          onClose();
        } else {
          toast.error(response.message || "Failed to save QC data");
        }
      } catch (error: unknown) {
        console.error("Error saving QC data:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "object" && error !== null && "response" in error
              ? (error as { response?: { data?: { message?: string } } })
                  .response?.data?.message || "Failed to save QC data"
              : "Failed to save QC data";
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const roleId = Number(currentUser?.role_id);
  const userRole = currentUser?.user_role || currentUser?.role_name;

  const isQA = roleId === 5 || userRole === "QA_AGENT" || userRole === "qa";
  const isAM =
    roleId === 4 ||
    userRole === "ASSISTANT_MANAGER" ||
    userRole === "assistant manager";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
        <DialogHeader className="p-6  bg-blue-600  text-white">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                {isEditMode ? (
                  <Save className="w-6 h-6" />
                ) : (
                  <Calendar className="w-6 h-6" />
                )}
                {isEditMode ? "Edit Daily Entry" : "Add Daily Entry"}
              </DialogTitle>
              {targetUser && (
                <p className="text-blue-100 text-sm mt-1">
                  {targetUser.user_name || targetUser.name} -{" "}
                  {targetUser.team_name || "Team B"}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <form
            id="daily-entry-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Clock className="w-4 h-4 text-blue-600" />
                Assign Hours
                {isQA && (
                  <span className="text-xs font-normal text-slate-500 ml-2">
                    (Read-only)
                  </span>
                )}
              </Label>
              <Input
                type="number"
                name="assignHours"
                value={formData.assignHours}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting || isQA}
                placeholder="Enter hours (e.g., 8.5)"
                className={`${touched.assignHours && errors.assignHours ? "border-red-500" : ""}`}
              />
              {touched.assignHours && errors.assignHours && (
                <p className="text-xs text-red-600 font-medium">
                  {errors.assignHours}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Award className="w-4 h-4 text-blue-600" />
                QC Score
                {isAM && (
                  <span className="text-xs font-normal text-slate-500 ml-2">
                    (Read-only)
                  </span>
                )}
              </Label>
              <Input
                type="number"
                name="qcScore"
                value={formData.qcScore}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting || isAM}
                placeholder="Enter QC score (0-100)"
                className={`${touched.qcScore && errors.qcScore ? "border-red-500" : ""}`}
              />
              {touched.qcScore && errors.qcScore && (
                <p className="text-xs text-red-600 font-medium">
                  {errors.qcScore}
                </p>
              )}
            </div>
          </form>
        </div>

        <DialogFooter className="p-6 bg-slate-50 border-t border-slate-200 flex sm:justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded border-2"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="daily-entry-form"
            disabled={isSubmitting}
            className="rounded bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditMode ? "Update Entry" : "Save Entry"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DailyEntryFormModal;
