import React, { useState, useEffect, useMemo } from "react";
import { FileText, Plus, Edit2, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import {
  fetchAFDRecords,
  createAFDRecord,
  updateAFDRecord,
  deleteAFDRecord,
} from "../../services/manageService";
import {
  AFDRecord,
  AFDCategory,
  APIResponseContainer,
  APIResponseAFD,
  APIResponseCategory,
} from "../../types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Loading from "@/components/common/Loading";
import { DataTable } from "@/components/ui/data-table";
import AFDFormModal from "./AFDFormModal";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";

const AFDManagement: React.FC = () => {
  const [afdRecords, setAfdRecords] = useState<AFDRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AFDRecord | null>(null);
  const [isDeleteDiagOpen, setIsDeleteDiagOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<AFDRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAFDRecords = async () => {
    try {
      setLoading(true);
      const res = await fetchAFDRecords();

      if (res.status === 200 || res.status === "200" || res.success) {
        let rawData = [];
        // Handle different possible response structures
        if (res.data && res.data.rows) {
          rawData = res.data.rows;
        } else if (res.data && Array.isArray(res.data)) {
          rawData = res.data;
        } else if (Array.isArray(res.data?.data)) {
          rawData = res.data.data;
        } else {
          rawData = res.items || res.rows || (Array.isArray(res) ? res : []);
        }

        const records: AFDRecord[] = (rawData || []).map((item: APIResponseContainer) => ({
          id: item.afd_id || item.qc_afd_id || item.id || 0,
          name: item.afd_name || "Unnamed AFD",
          afd_id: item.afd_id,
          qc_afd_id: item.qc_afd_id,
          afd_points: item.afd_points || 0,
          categories: (item.categories || item.afd || []).map((cat: APIResponseCategory | any) => ({
            id: cat.qc_afd_id || cat.afd_id || cat.id,
            name: cat.afd_name || cat.qc_afd_name || cat.name,
            score: cat.afd_points || cat.score || 0,
            subCategories: (cat.subcategories || cat.afd_sub_categories || []).map((sub: any) => ({
              id: sub.qc_afd_id || sub.id,
              name: sub.afd_name || sub.qc_afd_name || sub.name,
              score: sub.afd_points || sub.score || 0,
            })),
          })),
        }));

        setAfdRecords(records);
      }
    } catch (error: unknown) {
      console.error("Failed to load AFD records:", error);
      toast.error("Could not load AFD records. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAFDRecords();
  }, []);

  const handleSaveAFD = async (data: {
    afd_name: string;
    categories: AFDCategory[];
  }) => {
    try {
      let res;
      if (editingRecord) {
        res = await updateAFDRecord(
          editingRecord.afd_id || editingRecord.id,
          data,
        );
      } else {
        res = await createAFDRecord(data);
      }

      if (res.status === 200 || res.status === 201) {
        toast.success(
          editingRecord
            ? "AFD updated successfully"
            : "AFD created successfully",
        );
        loadAFDRecords();
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || "Failed to save AFD");
      throw error;
    }
  };

  const handleEditAFD = (record: AFDRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleDeleteAFD = (record: AFDRecord) => {
    setRecordToDelete(record);
    setIsDeleteDiagOpen(true);
  };

  const handleConfirmDeleteAFD = async () => {
    if (!recordToDelete) return;
    const id = recordToDelete.afd_id || recordToDelete.id;
    try {
      setDeleting(true);
      const res = await deleteAFDRecord(id);
      if (res.status === 200) {
        toast.success("AFD deleted successfully");
        setIsDeleteDiagOpen(false);
        setRecordToDelete(null);
        loadAFDRecords();
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || "Failed to delete AFD");
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnDef<AFDRecord>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "AFD Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FileText className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-700">
              {row.original.name}
            </span>
          </div>
        ),
      },
      {
        id: "categories",
        header: "Categories",
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
            {(row.original.categories || []).length} Categories
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon-xs"
              className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => handleEditAFD(row.original)}
              title="Edit AFD"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
              onClick={() => handleDeleteAFD(row.original)}
              title="Delete AFD"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const filteredRecords = useMemo(
    () =>
      afdRecords.filter((rec) =>
        (rec.name || "").toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [afdRecords, searchTerm],
  );

  if (loading && afdRecords.length === 0) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <FileText className="w-7 h-7 text-blue-700" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">AFD Management</h3>
            <p className="text-muted-foreground text-sm">
              Application for Development - Scoring Categories & Criteria
            </p>
          </div>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 font-bold"
          onClick={() => {
            setEditingRecord(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add AFD
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by AFD name..."
              className="pl-10 h-11 bg-slate-50/50 border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredRecords}
            loading={loading}
          />
        </CardContent>
      </Card>

      <AFDFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={loadAFDRecords}
        record={editingRecord}
        onSave={handleSaveAFD}
      />

      <DeleteConfirmDialog
        open={isDeleteDiagOpen}
        onOpenChange={setIsDeleteDiagOpen}
        title="Delete AFD Record"
        description={`Are you sure you want to delete the AFD record "${recordToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDeleteAFD}
        loading={deleting}
      />
    </div>
  );
};

export default AFDManagement;
