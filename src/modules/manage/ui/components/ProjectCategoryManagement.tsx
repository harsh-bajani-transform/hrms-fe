import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FolderKanban,
  Plus,
  Edit2,
  Trash2,
  Search,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
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
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Loading from "@/components/common/Loading";
import CategoryFormModal from "./CategoryFormModal";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";

const ProjectCategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [afdRecords, setAfdRecords] = useState<AFDRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ProjectCategory | null>(null);
  const [isDeleteDiagOpen, setIsDeleteDiagOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] =
    useState<ProjectCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteClick = (category: ProjectCategory) => {
    setCategoryToDelete(category);
    setIsDeleteDiagOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      setDeleting(true);
      const res = await deleteProjectCategory(
        categoryToDelete.project_category_id,
      );
      if (res.status === 200) {
        toast.success("Category deleted successfully");
        setIsDeleteDiagOpen(false);
        setCategoryToDelete(null);
        loadData();
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || "Failed to delete category");
    } finally {
      setDeleting(false);
    }
  };

  const getAfdName = useCallback(
    (afdId: string | number) => {
      const record = afdRecords.find(
        (r) => String(r.afd_id || r.id) === String(afdId),
      );
      return record?.afd_name || record?.name || `AFD #${afdId}`;
    },
    [afdRecords],
  );

  const columns: ColumnDef<ProjectCategory>[] = useMemo(
    () => [
      {
        id: "srNo",
        header: "Sr. No.",
        cell: ({ row }) => (
          <span className="text-slate-500 font-medium">{row.index + 1}</span>
        ),
      },
      {
        accessorKey: "project_category_name",
        header: "Category Name",
        cell: ({ row }) => (
          <span className="font-bold text-slate-700">
            {row.original.project_category_name}
          </span>
        ),
      },
      {
        id: "afdName",
        header: "AFD Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-slate-600">
            <div className="p-1.5 bg-blue-50 rounded-lg shrink-0">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="font-medium">
              {getAfdName(row.original.afd_id)}
            </span>
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
              onClick={() => handleEditClick(row.original)}
              title="Edit Category"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
              onClick={() => handleDeleteClick(row.original)}
              title="Delete Category"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [getAfdName],
  );

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const nameMatch = (cat?.project_category_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const afdMatch = getAfdName(cat?.afd_id || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return nameMatch || afdMatch;
    });
  }, [categories, searchTerm, getAfdName]);

  if (loading && categories.length === 0) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <FolderKanban className="w-7 h-7 text-blue-700" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Project Categories</h3>
            <p className="text-muted-foreground text-sm font-medium">
              Define and manage categories for project classification
            </p>
          </div>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 font-bold"
          onClick={() => {
            setEditingCategory(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search categories..."
              className="pl-10 h-11 bg-slate-50/50 border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredCategories}
            loading={loading}
          />
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

      <DeleteConfirmDialog
        open={isDeleteDiagOpen}
        onOpenChange={setIsDeleteDiagOpen}
        title="Delete Category"
        description={`Are you sure you want to delete the category "${categoryToDelete?.project_category_name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </div>
  );
};

export default ProjectCategoryManagement;
