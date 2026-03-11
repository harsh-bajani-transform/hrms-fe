import React, { useState, useRef } from "react";
import {
  Upload,
  ClipboardList,
  Calendar,
  Users,
  FileText,
  X,
  PlusCircle,
  Hash,
  ChevronDown,
  Trash2,
  Table as TableIcon,
  Layers,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addTask, updateTask } from "../../services/manageService";
import { useDeviceInfo } from "../../../../hooks/useDeviceInfo";

import type { TaskFormModalProps } from "../../types";

interface FormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  assignedTo: string;
  projectId: string;
  attachment: string | null;
  target: string;
  teamIds: (string | number)[];
  importantColumns: string[];
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({
  task,
  onClose,
  onSuccess,
  dropdowns,
}) => {
  const isEditMode = !!task;
  const { device_id, device_type } = useDeviceInfo();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    name: task?.task_name || "",
    description: task?.task_description || "",
    startDate: task?.start_date || "",
    endDate: task?.end_date || "",
    assignedTo: task?.assigned_to?.toString() || "",
    projectId: task?.project_id?.toString() || "",
    attachment: null,
    target: task?.task_target?.toString() || "",
    teamIds: task?.task_team_id
      ? Array.isArray(task.task_team_id)
        ? task.task_team_id.map((id) => id.toString())
        : [task.task_team_id.toString()]
      : [],
    importantColumns: task?.important_columns || [],
  });

  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(
    task?.attachment || null,
  );
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );

  const validate = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = "Task name is required";
    if (!formData.projectId) newErrors.projectId = "Project is required";
    if (!formData.target || isNaN(Number(formData.target)))
      newErrors.target = "Target is required and must be a number";
    if (formData.teamIds.length === 0)
      newErrors.teamIds = "At least one agent must be assigned";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setIsSubmitting(true);

      const submitData = new FormData();
      submitData.append("project_id", formData.projectId);
      submitData.append("task_name", formData.name);
      submitData.append("task_description", formData.description);
      submitData.append("task_target", formData.target);
      submitData.append("device_id", device_id);
      submitData.append("device_type", device_type);

      submitData.append(
        "task_team_id",
        JSON.stringify(formData.teamIds.map(Number)),
      );

      if (formData.importantColumns.length > 0) {
        submitData.append(
          "important_columns",
          JSON.stringify(formData.importantColumns),
        );
      }

      if (fileInputRef.current?.files?.[0]) {
        submitData.append("task_file", fileInputRef.current.files[0]);
      }

      if (isEditMode) {
        submitData.append("task_id", String(task?.task_id));
        await updateTask(submitData);
        toast.success("Task updated successfully");
      } else {
        await addTask(submitData);
        toast.success("Task created successfully");
      }
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      setAttachmentPreview(file.name);

      // Parse Excel headers if it's a spreadsheet
      const isExcel = file.name.match(/\.(xlsx|xls|csv)$/);
      if (isExcel) {
        try {
          const reader = new FileReader();
          reader.onload = (event) => {
            const buffer = event.target?.result;
            if (buffer instanceof ArrayBuffer) {
              const data = new Uint8Array(buffer);
              const workbook = XLSX.read(data, { type: "array" });
              const firstSheetName = workbook.SheetNames[0];
              if (firstSheetName) {
                const worksheet = workbook.Sheets[firstSheetName];
                if (worksheet) {
                  const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                  }) as string[][];

                  if (jsonData && jsonData.length > 0 && jsonData[0]) {
                    const headers = jsonData[0]
                      .filter(
                        (h) =>
                          h !== null &&
                          h !== undefined &&
                          String(h).trim() !== "",
                      )
                      .map((h) => String(h).trim());
                    setExcelHeaders(headers);
                    setFormData((prev) => ({ ...prev, importantColumns: [] }));
                    toast.success(
                      `Successfully parsed ${headers.length} columns from file`,
                    );
                  }
                }
              }
            }
          };
          reader.readAsArrayBuffer(file);
        } catch (err) {
          console.error("Error parsing spreadsheet:", err);
          toast.error("Failed to parse spreadsheet headers");
        }
      }
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-white">
        {/* Banner Header */}
        <div className="bg-linear-to-r from-blue-600 to-blue-700 px-8 py-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/20 rounded-full -ml-12 -mb-12 blur-xl" />

          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded flex items-center justify-center border border-white/30 shadow-inner">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-white leading-none">
                {isEditMode ? "Update Task" : "New Task Assignment"}
              </DialogTitle>
              <p className="text-blue-100/80 text-sm font-medium mt-1.5">
                {isEditMode
                  ? `Refining ${task?.task_name}`
                  : "Organize effort and track progress"}
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-8 bg-white max-h-[70vh] overflow-y-auto scrollbar-hide"
        >
          {/* Attachment Area */}
          <div className="flex flex-col items-center justify-center space-y-4 mb-4">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 group-hover:border-blue-400 overflow-hidden flex items-center justify-center transition-all bg-linear-to-b from-white to-slate-50">
                {attachmentPreview ? (
                  <div className="flex flex-col items-center gap-1">
                    <TableIcon className="w-8 h-8 text-blue-600" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-400 group-hover:text-blue-500">
                    <Upload className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity">
                <PlusCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                {attachmentPreview ? "File Ready" : "Upload Reference file"}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 max-w-[200px] truncate italic">
                {attachmentPreview
                  ? attachmentPreview
                  : ".xlsx, .xls, .csv preferred"}
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".xlsx,.xls,.csv"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* TASK NAME */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 px-1 flex items-center gap-1.5 uppercase tracking-wider">
                <ClipboardList className="w-3.5 h-3.5 text-blue-500" />
                Task Title
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. Data Analysis"
                className={` h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-sm font-medium ${errors.name ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
              />
            </div>

            {/* PROJECT */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 px-1 flex items-center gap-1.5 uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                Project
              </label>
              <Select
                value={formData.projectId}
                onValueChange={(val) =>
                  setFormData({ ...formData, projectId: val })
                }
              >
                <SelectTrigger
                  className={` h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-sm font-medium ${errors.projectId ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
                >
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                  {dropdowns.projects.map((p) => (
                    <SelectItem
                      key={(p.project_id || p.id)?.toString()}
                      value={(p.project_id || p.id)?.toString() || ""}
                      className="text-xs font-medium focus:bg-blue-50 focus:text-blue-700 py-2.5 rounded-lg my-0.5"
                    >
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ASSIGN TO */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 px-1 flex items-center gap-1.5 uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                Assignee
              </label>
              <Select
                value={formData.assignedTo}
                onValueChange={(val) =>
                  setFormData({ ...formData, assignedTo: val })
                }
              >
                <SelectTrigger
                  className={` h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-sm font-medium ${errors.assignedTo ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
                >
                  <SelectValue placeholder="Select User" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                  {dropdowns.users.map((u) => (
                    <SelectItem
                      key={(u.user_id || u.id)?.toString()}
                      value={(u.user_id || u.id)?.toString() || ""}
                      className="text-xs font-medium focus:bg-blue-50 focus:text-blue-700 py-2.5 rounded-lg my-0.5"
                    >
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* TARGET (HOURS) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 px-1 flex items-center gap-1.5 uppercase tracking-wider">
                <Hash className="w-3.5 h-3.5 text-blue-500" />
                Target (Hrs)
              </label>
              <Input
                name="target"
                type="number"
                value={formData.target}
                onChange={(e) =>
                  setFormData({ ...formData, target: e.target.value })
                }
                placeholder="e.g. 10"
                className={` h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-sm font-medium ${errors.target ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100"}`}
              />
              {errors.target && (
                <p className="text-[10px] text-red-500 font-bold mt-1 px-1">
                  {errors.target}
                </p>
              )}
            </div>

            {/* TEAM ASSIGNMENT (AGENTS) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 px-1 flex items-center gap-1.5 uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                Agent(s)
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={` h-11 w-full bg-slate-50/50 border-slate-200 flex justify-between px-3 text-sm font-medium ${errors.teamIds ? "border-red-500 ring-red-50/50" : "focus:border-blue-400 focus:ring-blue-100 hover:bg-white"}`}
                  >
                    <span className="truncate">
                      {formData.teamIds.length > 0
                        ? `${formData.teamIds.length} Agents Selected`
                        : "Select Agents"}
                    </span>
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 max-h-[300px] overflow-y-auto rounded-xl border-slate-200 shadow-xl p-1">
                  {dropdowns.users.map((u) => {
                    const id = (u.user_id || u.id)?.toString() || "";
                    return (
                      <DropdownMenuCheckboxItem
                        key={id}
                        checked={formData.teamIds.includes(id)}
                        onCheckedChange={(checked) => {
                          const nextIds = checked
                            ? [...formData.teamIds, id]
                            : formData.teamIds.filter((x) => x !== id);
                          setFormData({ ...formData, teamIds: nextIds });
                        }}
                        className="text-xs font-medium py-2.5 rounded-lg my-0.5 focus:bg-blue-50 focus:text-blue-700"
                      >
                        {u.label}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              {errors.teamIds && (
                <p className="text-[10px] text-red-500 font-bold mt-1 px-1">
                  {errors.teamIds}
                </p>
              )}
            </div>

            {/* IMPORTANT COLUMNS - REFACTORED TO SELECTION DROPDOWN */}
            <div className="md:col-span-2 space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <TableIcon className="w-4 h-4 text-blue-600" />
                  Important Columns
                </label>
                {!excelHeaders.length && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        importantColumns: [...formData.importantColumns, ""],
                      })
                    }
                    className="h-7 text-[10px] font-bold text-blue-600 uppercase tracking-wider hover:bg-blue-50"
                  >
                    <PlusCircle className="w-3.5 h-3.5 mr-1" /> Add Manual
                  </Button>
                )}
              </div>

              {excelHeaders.length > 0 ? (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-[10px] text-green-600 font-bold px-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    SELECT COLUMNS FROM {excelHeaders.length} FOUND HEADERS
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-11 w-full bg-blue-50/30 border-blue-200 flex justify-between px-3 text-sm font-medium hover:bg-blue-50/50 text-blue-800"
                      >
                        <span className="truncate">
                          {formData.importantColumns.length > 0
                            ? `${formData.importantColumns.length} Columns Selected`
                            : "Select Important Columns"}
                        </span>
                        <ChevronDown className="w-4 h-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 max-h-[300px] overflow-y-auto rounded-xl border-slate-200 shadow-xl p-1">
                      {excelHeaders.map((header) => (
                        <DropdownMenuCheckboxItem
                          key={header}
                          checked={formData.importantColumns.includes(header)}
                          onCheckedChange={(checked) => {
                            const nextCols = checked
                              ? [...formData.importantColumns, header]
                              : formData.importantColumns.filter(
                                  (x) => x !== header,
                                );
                            setFormData({
                              ...formData,
                              importantColumns: nextCols,
                            });
                          }}
                          className="text-xs font-medium py-2.5 rounded-lg my-0.5 focus:bg-blue-50 focus:text-blue-700"
                        >
                          {header}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formData.importantColumns.map((col, idx) => (
                    <div key={idx} className="group flex items-center gap-2">
                      <Input
                        value={col}
                        onChange={(e) => {
                          const newCols = [...formData.importantColumns];
                          newCols[idx] = e.target.value;
                          setFormData({
                            ...formData,
                            importantColumns: newCols,
                          });
                        }}
                        placeholder={`Column ${idx + 1}`}
                        className="bg-slate-50 border-slate-200 focus:bg-white h-11 text-xs font-medium"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newCols = formData.importantColumns.filter(
                            (_, i) => i !== idx,
                          );
                          setFormData({
                            ...formData,
                            importantColumns: newCols,
                          });
                        }}
                        className="h-11 w-11 text-slate-300 hover:text-rose-500 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {formData.importantColumns.length === 0 && (
                    <div className="col-span-full py-10 flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                      <TableIcon className="w-8 h-8 text-slate-200 mb-2" />
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest text-center">
                        Upload Excel to extract columns
                        <br />
                        <span className="text-[9px] font-medium normal-case italic">
                          or add manually using the button above
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Selected Columns Visualization */}
              {formData.importantColumns.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {formData.importantColumns.map(
                    (col, idx) =>
                      col && (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none px-3 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                        >
                          {col}
                          {/* <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                importantColumns: prev.importantColumns.filter(
                                  (_, i) => i !== idx,
                                ),
                              }));
                            }}
                          /> */}
                        </Badge>
                      ),
                  )}
                </div>
              )}
            </div>

            {/* DESCRIPTION */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 px-1 flex items-center gap-1.5 uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                Task Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                placeholder="Detail the expectations and goals..."
                className="w-full p-4 text-sm font-medium rounded-xl bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 transition-all outline-none resize-none scrollbar-hide"
              />
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-slate-100 flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 font-bold text-slate-500 border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 text-white font-bold rounded-xl transition-all border-none scale-100 active:scale-95"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Create Task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskFormModal;
