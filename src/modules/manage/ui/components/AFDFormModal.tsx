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
import { AFDRecord, AFDCategory, AFDSubCategory } from "../../types";
import { Plus, Save, Trash2, X } from "lucide-react";

interface AFDFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  record?: AFDRecord | null;
  onSave: (data: {
    afd_name: string;
    categories: AFDCategory[];
  }) => Promise<void>;
}

const AFDFormModal: React.FC<AFDFormModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  record,
  onSave,
}) => {
  const [afdName, setAfdName] = useState("");
  const [categories, setCategories] = useState<AFDCategory[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (record) {
      setAfdName(record.afd_name || record.name || "");
      setCategories(JSON.parse(JSON.stringify(record.categories || [])));
    } else {
      setAfdName("");
      setCategories([]);
    }
  }, [record, open]);

  const addCategory = () => {
    setCategories([
      ...categories,
      {
        id: Date.now(),
        name: "",
        score: 0,
        subCategories: [{ id: Date.now() + 1, name: "", score: 0 }],
      },
    ]);
  };

  const removeCategory = (categoryId: string | number) => {
    setCategories(categories.filter((cat) => cat.id !== categoryId));
  };

  const updateCategory = (
    categoryId: string | number,
    field: keyof AFDCategory,
    value: string | number,
  ) => {
    setCategories(
      categories.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              [field]:
                field === "score" ? Math.max(0, Number(value) || 0) : value,
            }
          : cat,
      ),
    );
  };

  const addSubCategory = (categoryId: string | number) => {
    setCategories(
      categories.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              subCategories: [
                ...cat.subCategories,
                { id: Date.now(), name: "", score: 0 },
              ],
            }
          : cat,
      ),
    );
  };

  const removeSubCategory = (
    categoryId: string | number,
    subCategoryId: string | number,
  ) => {
    setCategories(
      categories.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              subCategories: cat.subCategories.filter(
                (sub) => sub.id !== subCategoryId,
              ),
            }
          : cat,
      ),
    );
  };

  const updateSubCategory = (
    categoryId: string | number,
    subCategoryId: string | number,
    field: keyof AFDSubCategory,
    value: string | number,
  ) => {
    setCategories(
      categories.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              subCategories: cat.subCategories.map((sub) =>
                sub.id === subCategoryId
                  ? {
                      ...sub,
                      [field]:
                        field === "score"
                          ? Math.max(0, Number(value) || 0)
                          : value,
                    }
                  : sub,
              ),
            }
          : cat,
      ),
    );
  };

  const getTotalCategoryScore = () => {
    return categories.reduce((sum, cat) => sum + (Number(cat.score) || 0), 0);
  };

  const getSubCategoryTotal = (categoryId: string | number) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category
      ? category.subCategories.reduce(
          (sum, sub) => sum + (Number(sub.score) || 0),
          0,
        )
      : 0;
  };

  const isFormValid = () => {
    if (!afdName.trim()) return false;
    // Categories are optional — only validate scores if user added some
    if (categories.length > 0) {
      const catTotal = getTotalCategoryScore();
      if (catTotal !== 100) return false;

      for (const cat of categories) {
        if (!cat.name.trim()) return false;
        if (cat.subCategories.length > 0) {
          const subTotal = getSubCategoryTotal(cat.id);
          if (subTotal !== 100) return false;
          if (cat.subCategories.some((sub) => !sub.name.trim())) return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!afdName.trim()) return;
    try {
      setSubmitting(true);
      await onSave({ afd_name: afdName.trim(), categories });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Failed to save AFD:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" />
            {record ? "Edit AFD Record" : "Create New AFD Record"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              AFD Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. Quality Control Checklist"
              value={afdName}
              onChange={(e) => setAfdName(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-700 flex items-center gap-2">
                Categories
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                    getTotalCategoryScore() === 100
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  Total: {getTotalCategoryScore()}/100
                </span>
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={addCategory}
                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </div>

            <div className="space-y-4">
              {categories.map((cat) => {
                const subTotal = getSubCategoryTotal(cat.id);
                return (
                  <div
                    key={cat.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Category Name
                          </label>
                          <Input
                            placeholder="Category Name"
                            value={cat.name}
                            onChange={(e) =>
                              updateCategory(cat.id, "name", e.target.value)
                            }
                            className="bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right block">
                            Score Weightage
                          </label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Score"
                            value={cat.score}
                            onChange={(e) =>
                              updateCategory(cat.id, "score", e.target.value)
                            }
                            className="bg-white text-right font-bold"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mt-6 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => removeCategory(cat.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="pl-6 space-y-3 border-l-2 border-indigo-100">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          Sub-categories
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              subTotal === 100
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {subTotal}/100
                          </span>
                        </label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addSubCategory(cat.id)}
                          className="h-7 text-[10px] font-bold text-blue-600 uppercase tracking-wider"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Sub
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {cat.subCategories.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-100"
                          >
                            <Input
                              placeholder="Subcategory Name"
                              value={sub.name}
                              onChange={(e) =>
                                updateSubCategory(
                                  cat.id,
                                  sub.id,
                                  "name",
                                  e.target.value,
                                )
                              }
                              className="h-8 text-xs border-none shadow-none focus-visible:ring-0 px-0 translate-x-2"
                            />
                            <div className="w-20">
                              <Input
                                type="number"
                                min="0"
                                value={sub.score}
                                onChange={(e) =>
                                  updateSubCategory(
                                    cat.id,
                                    sub.id,
                                    "score",
                                    e.target.value,
                                  )
                                }
                                className="h-8 text-xs text-right font-semibold border-none shadow-none focus-visible:ring-0"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50"
                              onClick={() => removeSubCategory(cat.id, sub.id)}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={handleSubmit}
            disabled={submitting || !isFormValid()}
          >
            <Save className="w-4 h-4" />
            {submitting ? "Saving..." : record ? "Update AFD" : "Save AFD"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AFDFormModal;
