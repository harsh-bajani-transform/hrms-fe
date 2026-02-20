import React, { useState, useEffect } from "react";
import { FileText, Plus, Edit2, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import {
  fetchAFDRecords,
  createAFDRecord,
  updateAFDRecord,
  deleteAFDRecord,
} from "../../services/manageService";
import { AFDRecord, AFDCategory } from "../../types";
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
import AFDFormModal from "./AFDFormModal";

const AFDManagement: React.FC = () => {
  const [afdRecords, setAfdRecords] = useState<AFDRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AFDRecord | null>(null);

  const loadAFDRecords = async () => {
    try {
      setLoading(true);
      const data = await fetchAFDRecords();
      if (data.status === 200) {
        setAfdRecords(data.data?.rows || []);
      }
    } catch (error: unknown) {
      console.error("Failed to load AFD records:", error);
      toast.error("Failed to load AFD records");
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

      if (res.status === 200) {
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

  const handleDeleteAFD = async (record: AFDRecord) => {
    const name = record.afd_name || record.name;
    const id = record.afd_id || record.id;
    if (!window.confirm(`Are you sure you want to delete AFD: ${name}?`))
      return;

    try {
      const res = await deleteAFDRecord(id);
      if (res.status === 200) {
        toast.success("AFD deleted successfully");
        loadAFDRecords();
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || "Failed to delete AFD");
    }
  };

  const filteredRecords = afdRecords.filter((rec) =>
    (rec?.afd_name || rec?.name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  if (loading && afdRecords.length === 0) {
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
                <FileText className="w-7 h-7 text-blue-700" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">AFD Management</h3>
                <p className="text-muted-foreground">
                  Application for Development - Scoring Categories & Criteria
                </p>
              </div>
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                setEditingRecord(null);
                setIsModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add AFD
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Records List */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search by AFD name..."
          className="pl-10 h-11 bg-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((rec: any) => (
            <Card
              key={rec.qc_afd_id || rec.afd_id || rec.id}
              className="group hover:border-indigo-200 transition-all"
            >
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">
                      {rec.afd_name || rec.name}
                    </CardTitle>
                    <CardDescription>
                      Points: {rec.afd_points || 0} | Checkpoint ID:{" "}
                      {rec.qc_afd_id}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => handleEditAFD(rec)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                    onClick={() => handleDeleteAFD(rec)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="details" className="border-none">
                    <AccordionTrigger className="hover:no-underline py-0 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      View Checkpoint Details
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">
                            Points Weightage:
                          </span>
                          <span className="font-bold text-indigo-600">
                            {rec.afd_points}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Category ID:</span>
                          <span className="font-medium">
                            {rec.afd_category_id || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Created At:</span>
                          <span className="text-xs text-slate-400">
                            {rec.created_at}
                          </span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-20 text-center bg-white rounded-xl border border-dashed text-slate-400 italic">
            No AFD records found.
          </div>
        )}
      </div>

      <AFDFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={loadAFDRecords}
        record={editingRecord}
        onSave={handleSaveAFD}
      />
    </div>
  );
};

export default AFDManagement;
