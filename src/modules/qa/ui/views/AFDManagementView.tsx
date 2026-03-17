import React, { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Plus,
  Trash2,
  Save,
  ChevronRight,
  Award,
  LayoutGrid,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";

import {
  fetchProjectCategories,
  fetchProjectCategoryAFD,
  updateProjectCategoryAFD,
} from "../../services/qcService";
import { AFDApiItem, AFDApiCategory, AFDApiSubcategory } from "../../types";

const AFDManagementView: React.FC = () => {
  const [categories, setCategories] = useState<Record<string, any>[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | number>(
    "",
  );
  const [afdConfig, setAfdConfig] = useState<AFDApiCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModified, setIsModified] = useState(false);

  // Load project categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const res = await fetchProjectCategories();
        setCategories(res.data || []);
      } catch (error) {
        console.error("Error loading categories:", error);
        toast.error("Failed to load project categories");
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  // Load AFD config when category changes
  const loadAFDConfig = useCallback(async (catId: string | number) => {
    if (!catId) {
      setAfdConfig([]);
      return;
    }

    try {
      setLoading(true);
      const res = await fetchProjectCategoryAFD(catId);
      // The API returns an AFDData object which has a categories array
      const data = res.data as AFDApiItem;
      setAfdConfig(data.categories || []);
      setIsModified(false);
    } catch (error) {
      console.error("Error loading AFD config:", error);
      toast.error("Failed to load AFD configuration");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      loadAFDConfig(selectedCategoryId);
    }
  }, [selectedCategoryId, loadAFDConfig]);

  const handleAddCategory = () => {
    const newCategory: AFDApiCategory = {
      qc_afd_id: Date.now(), // Temp ID
      afd_name: "New Category",
      afd_points: 0,
      subcategories: [],
    };
    setAfdConfig([...afdConfig, newCategory]);
    setIsModified(true);
  };

  const handleRemoveCategory = (id: number) => {
    setAfdConfig(afdConfig.filter((c) => c.qc_afd_id !== id));
    setIsModified(true);
  };

  const handleUpdateCategory = (
    id: number,
    field: keyof AFDApiCategory,
    value: string | number,
  ) => {
    setAfdConfig(
      afdConfig.map((c) => (c.qc_afd_id === id ? { ...c, [field]: value } : c)),
    );
    setIsModified(true);
  };

  const handleAddSubcategory = (catId: number) => {
    setAfdConfig(
      afdConfig.map((c) => {
        if (c.qc_afd_id === catId) {
          return {
            ...c,
            subcategories: [
              ...(c.subcategories || []),
              {
                qc_afd_id: Date.now(),
                afd_name: "New Subcategory",
                afd_points: 0,
              },
            ],
          };
        }
        return c;
      }),
    );
    setIsModified(true);
  };

  const handleUpdateSubcategory = (
    catId: number,
    subId: number,
    field: keyof AFDApiSubcategory,
    value: string | number,
  ) => {
    setAfdConfig(
      afdConfig.map((c) => {
        if (c.qc_afd_id === catId) {
          return {
            ...c,
            subcategories: (c.subcategories || []).map((s) =>
              s.qc_afd_id === subId ? { ...s, [field as keyof AFDApiSubcategory]: value } : s,
            ),
          };
        }
        return c;
      }),
    );
    setIsModified(true);
  };

  const handleRemoveSubcategory = (catId: number, subId: number) => {
    setAfdConfig(
      afdConfig.map((c) => {
        if (c.qc_afd_id === catId) {
          return {
            ...c,
            subcategories: (c.subcategories || []).filter(
              (s) => s.qc_afd_id !== subId,
            ),
          };
        }
        return c;
      }),
    );
    setIsModified(true);
  };

  const handleSave = async () => {
    if (!selectedCategoryId) return;

    try {
      setSaving(true);
      await updateProjectCategoryAFD({
        project_category_id: selectedCategoryId,
        categories: afdConfig,
      });
      toast.success("AFD Configuration saved successfully");
      setIsModified(false);
      // Re-load to get real IDs from server if any were temp
      loadAFDConfig(selectedCategoryId);
    } catch (error) {
      console.error("Error saving AFD:", error);
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Category Selection */}
      <Card className="border-none shadow-sm bg-linear-to-r from-blue-600 to-indigo-700 text-white">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                <Settings className="w-8 h-8" />
                AFD Management
              </h2>
              <p className="text-blue-100 font-medium">
                Configure audit categories and point deductions for different
                project types.
              </p>
            </div>

            <div className="w-full md:w-80 space-y-2">
              <Label className="text-xs font-bold uppercase text-blue-200">
                Select Project Category
              </Label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all font-semibold"
              >
                <option value="" className="text-slate-900">
                  Choose a category...
                </option>
                {categories.map((cat) => (
                  <option
                    key={cat.id || cat.project_category_id}
                    value={cat.id || cat.project_category_id}
                    className="text-slate-900"
                  >
                    {cat.name || cat.project_category_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedCategoryId ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-20 text-center flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-slate-50 rounded-full">
            <LayoutGrid className="w-12 h-12 text-slate-300" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">
              No Category Selected
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              Please select a project category from the dropdown above to manage
              its Audit Feedback Document configuration.
            </p>
          </div>
        </div>
      ) : loading ? (
        <div className="py-20 flex justify-center items-center flex-col space-y-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">
            Loading AFD configuration...
          </p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-800">
                Configuration
              </h3>
              {isModified && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase">
                  Unsaved Changes
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleAddCategory}
                className="font-bold border-slate-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isModified || saving}
                className="bg-emerald-600 hover:bg-emerald-700 font-bold min-w-[120px]"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 pb-20">
            {afdConfig.length === 0 ? (
              <div className="bg-slate-50 rounded-xl p-12 text-center border border-slate-200">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">
                  No categories defined for this project type yet.
                </p>
                <Button
                  variant="link"
                  onClick={handleAddCategory}
                  className="text-blue-600 font-bold mt-2"
                >
                  Click here to add the first category
                </Button>
              </div>
            ) : (
              afdConfig.map((cat) => (
                <Card
                  key={cat.qc_afd_id}
                  className="border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="bg-slate-50/50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase text-slate-400">
                          Category Name
                        </Label>
                        <Input
                          value={cat.afd_name}
                          onChange={(e) =>
                            handleUpdateCategory(
                              cat.qc_afd_id,
                              "afd_name",
                              e.target.value,
                            )
                          }
                          className="font-bold text-slate-800 bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase text-slate-400">
                          Total Weight/Points
                        </Label>
                        <Input
                          type="number"
                          value={cat.afd_points}
                          onChange={(e) =>
                            handleUpdateCategory(
                              cat.qc_afd_id,
                              "afd_points",
                              Number(e.target.value),
                            )
                          }
                          className="font-bold text-slate-800 bg-white"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 ml-4"
                      onClick={() => handleRemoveCategory(cat.qc_afd_id)}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>

                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                          <ChevronRight className="w-4 h-4" />
                          Subcategories
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddSubcategory(cat.qc_afd_id)}
                          className="text-blue-600 font-bold text-xs"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Add Subcategory
                        </Button>
                      </div>

                      <div className="space-y-3 pl-4 border-l-2 border-slate-100">
                        {(cat.subcategories || []).map((sub) => (
                          <div
                            key={sub.qc_afd_id}
                            className="flex items-end gap-4 animate-in slide-in-from-left-2 duration-300"
                          >
                            <div className="flex-1 space-y-1">
                              <Label className="text-[9px] font-bold uppercase text-slate-400">
                                Name
                              </Label>
                              <Input
                                value={sub.afd_name}
                                onChange={(e) =>
                                  handleUpdateSubcategory(
                                    cat.qc_afd_id,
                                    sub.qc_afd_id,
                                    "afd_name",
                                    e.target.value,
                                  )
                                }
                                className="h-9 text-sm"
                              />
                            </div>
                            <div className="w-32 space-y-1">
                              <Label className="text-[9px] font-bold uppercase text-slate-400">
                                Deduction
                              </Label>
                              <Input
                                type="number"
                                value={sub.afd_points}
                                onChange={(e) =>
                                  handleUpdateSubcategory(
                                    cat.qc_afd_id,
                                    sub.qc_afd_id,
                                    "afd_points",
                                    Number(e.target.value),
                                  )
                                }
                                className="h-9 text-sm"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-slate-300 hover:text-red-500"
                              onClick={() =>
                                handleRemoveSubcategory(
                                  cat.qc_afd_id,
                                  sub.qc_afd_id,
                                )
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}

                        {(cat.subcategories || []).length === 0 && (
                          <p className="text-xs italic text-slate-400 py-2">
                            No subcategories defined.
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AFDManagementView;
