import React, { useState, useEffect } from "react";
import {
  FolderKanban,
  Plus,
  Edit2,
  Trash2,
  Search,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchProjectCategories,
  createProjectCategory,
  updateProjectCategory,
  deleteProjectCategory,
  fetchAFDRecords,
} from "../../services/manageService";
import { ProjectCategory, AFDRecord } from "../../types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Loading from "@/components/common/Loading";
import CategoryFormModal from "./CategoryFormModal";

const ProjectCategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [afdRecords, setAfdRecords] = useState<AFDRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ProjectCategory | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catRes, afdRes] = await Promise.all([
        fetchProjectCategories(),
        fetchAFDRecords(),
      ]);

      if (catRes.status === 200) {
        setCategories(catRes.data || []);
      }
      if (afdRes.status === 200) {
        setAfdRecords(afdRes.data?.rows || []);
      }
    } catch (error: unknown) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load categories or AFD records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveCategory = async (data: { name: string; afdId: string }) => {
    try {
      let res;
      if (editingCategory) {
        res = await updateProjectCategory(editingCategory.project_category_id, {
          name: data.name,
          afdName: data.afdId,
        });
      } else {
        res = await createProjectCategory({
          name: data.name,
          afdName: data.afdId,
        });
      }

      if (res.status === 200) {
        toast.success(
          editingCategory
            ? "Category updated successfully"
            : "Category added successfully",
        );
        loadData();
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || "Failed to save category");
      throw error;
    }
  };

  const handleEditClick = (category: ProjectCategory) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (category: ProjectCategory) => {
    if (
      !window.confirm(
        `Are you sure you want to delete category: ${category.project_category_name}?`,
      )
    )
      return;

    try {
      const res = await deleteProjectCategory(category.project_category_id);
      if (res.status === 200) {
        toast.success("Category deleted successfully");
        loadData();
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || "Failed to delete category");
    }
  };

  const getAfdName = (afdId: string | number) => {
    const record = afdRecords.find(
      (r) => String(r.afd_id || r.id) === String(afdId),
    );
    return record?.afd_name || record?.name || `AFD #${afdId}`;
  };

  const filteredCategories = categories.filter((cat) => {
    const nameMatch = (cat?.project_category_name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const afdMatch = getAfdName(cat?.afd_id || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return nameMatch || afdMatch;
  });

  if (loading && categories.length === 0) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="border-none overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <FolderKanban className="w-7 h-7 text-blue-700" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Project Categories</h3>
                <p className="text-muted-foreground">
                  Define and manage categories for project classification
                </p>
              </div>
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                setEditingCategory(null);
                setIsModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
        </div>
      </div>

      {/* Search and List */}
      <Card>
        <CardHeader className="pb-0">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search categories..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase tracking-wider">
                    Sr. No.
                  </th>
                  <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase tracking-wider">
                    Category Name
                  </th>
                  <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase tracking-wider">
                    AFD Name
                  </th>
                  <th className="px-4 py-3 text-center font-bold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat, idx) => (
                    <tr
                      key={cat.project_category_id}
                      className="hover:bg-slate-50/50"
                    >
                      <td className="px-4 py-4 text-slate-500 font-medium">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-slate-900">
                          {cat.project_category_name}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <FileText className="w-4 h-4 text-blue-500" />
                          {getAfdName(cat.afd_id)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => handleEditClick(cat)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => handleDeleteClick(cat)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 text-center text-slate-400 italic"
                    >
                      No categories found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <CategoryFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={loadData}
        afdRecords={afdRecords}
        category={editingCategory}
        onSave={handleSaveCategory}
      />
    </div>
  );
};

export default ProjectCategoryManagement;
