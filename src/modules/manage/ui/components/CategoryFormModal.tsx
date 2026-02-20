import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AFDRecord, ProjectCategory } from "../../types";
import { Plus, Save } from "lucide-react";

interface CategoryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  afdRecords: AFDRecord[];
  category?: ProjectCategory | null;
  onSave: (data: { name: string; afdId: string }) => Promise<void>;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  afdRecords,
  category,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [afdId, setAfdId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.project_category_name || category.name || "");
      setAfdId((category.afd_id || category.id)?.toString() || "");
    } else {
      setName("");
      setAfdId("");
    }
  }, [category, open]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (!afdId) return;

    try {
      setSubmitting(true);
      await onSave({ name: name.trim(), afdId });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Failed to save category:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const uniqueAFDs = Array.from(
    new Map(afdRecords.map((opt) => [opt.afd_id || opt.id, opt])).values(),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            {category ? "Edit Category" : "Add New Category"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Category Name
            </label>
            <Input
              placeholder="e.g. Web Development"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              AFD Selection
            </label>
            <Select value={afdId} onValueChange={setAfdId}>
              <SelectTrigger>
                <SelectValue placeholder="Select AFD" />
              </SelectTrigger>
              <SelectContent>
                {uniqueAFDs.map((opt) => (
                  <SelectItem
                    key={opt.afd_id || opt.id}
                    value={(opt.afd_id || opt.id)?.toString() || ""}
                  >
                    {opt.afd_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSubmit}
            disabled={submitting || !name.trim() || !afdId}
          >
            <Save className="w-4 h-4 mr-2" />
            {submitting ? "Saving..." : category ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryFormModal;
