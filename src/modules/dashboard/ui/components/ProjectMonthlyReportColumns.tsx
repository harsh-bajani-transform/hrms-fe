import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { type ProjectMonthlyReportRow } from "../../services/billableReportService";
import { Edit2, Trash2, Plus, Save, X } from "lucide-react";

export interface ProjectReportRow extends ProjectMonthlyReportRow {
  isNew?: boolean;
}

const columnHelper = createColumnHelper<ProjectReportRow>();

export interface ProjectEditData {
  monthly_target: string | number;
}

export function createColumns(
  onEdit: (row: ProjectReportRow) => void,
  onDelete: (row: ProjectReportRow) => void,
  onAdd: (row: ProjectReportRow) => void,
  editingId: string | number | null,
  addingProjectId: string | number | null,
  editData: ProjectEditData,
  setEditData: (data: ProjectEditData) => void,
  onSaveEdit: (id: string | number) => void,
  onCancelEdit: () => void,
  addData: ProjectEditData,
  setAddData: (data: ProjectEditData) => void,
  onSaveAdd: () => void,
  onCancelAdd: () => void,
): ColumnDef<ProjectReportRow, any>[] {
  return [
    columnHelper.accessor("project_name", {
      header: () => (
        <div className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[11px]">
          Project Name
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-4 py-2 font-bold text-slate-700">
          {row.original.project_name}
        </div>
      ),
    }),
    columnHelper.accessor("monthly_target", {
      header: () => (
        <div className="px-4 py-3 text-center font-bold  uppercase tracking-wider text-[11px]">
          Monthly Target
        </div>
      ),
      cell: ({ row }) => {
        const isEditing =
          editingId === row.original.project_monthly_tracker_id &&
          !row.original.isNew;
        const isAdding =
          addingProjectId === row.original.project_id && row.original.isNew;

        if (isEditing) {
          return (
            <div className="flex justify-center px-4 py-2">
              <input
                type="number"
                value={editData.monthly_target}
                onChange={(e) =>
                  setEditData({ ...editData, monthly_target: e.target.value })
                }
                className="w-24 px-2 py-1 text-center border-2 border-blue-500 rounded outline-none font-bold"
                autoFocus
              />
            </div>
          );
        }

        if (isAdding) {
          return (
            <div className="flex justify-center px-4 py-2">
              <input
                type="number"
                value={addData.monthly_target}
                onChange={(e) =>
                  setAddData({ ...addData, monthly_target: e.target.value })
                }
                className="w-24 px-2 py-1 text-center border-2 border-green-500 rounded outline-none font-bold"
                placeholder="Target"
                autoFocus
              />
            </div>
          );
        }

        return (
          <div
            className={`text-center font-bold ${row.original.isNew ? "text-slate-400 italic" : "text-slate-800"}`}
          >
            {row.original.isNew ? "Not set" : row.original.monthly_target}
          </div>
        );
      },
    }),
    columnHelper.accessor("achieved_hours", {
      header: () => (
        <div className="px-4 py-3 text-center font-bold  uppercase tracking-wider text-[11px]">
          Monthly Achieved Target
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-center font-bold text-emerald-600">
          {row.original.isNew ? "-" : row.original.achieved_hours || "0.00"}
        </div>
      ),
    }),
    columnHelper.accessor("pending_hours", {
      header: () => (
        <div className="px-4 py-3 text-center font-bold  uppercase tracking-wider text-[11px]">
          Monthly Pending Target
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-center font-bold text-rose-600">
          {row.original.isNew ? "-" : row.original.pending_hours || "0.00"}
        </div>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: () => (
        <div className="px-4 py-3 text-center font-bold  uppercase tracking-wider text-[11px]">
          Actions
        </div>
      ),
      cell: ({ row }) => {
        const isEditing =
          editingId === row.original.project_monthly_tracker_id &&
          !row.original.isNew;
        const isAdding =
          addingProjectId === row.original.project_id && row.original.isNew;

        if (isEditing) {
          return (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() =>
                  onSaveEdit(row.original.project_monthly_tracker_id)
                }
                className="p-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors"
                title="Save"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={onCancelEdit}
                className="p-1.5 bg-slate-50 text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        }

        if (isAdding) {
          return (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={onSaveAdd}
                className="p-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors"
                title="Save"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={onCancelAdd}
                className="p-1.5 bg-slate-50 text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        }

        if (row.original.isNew) {
          return (
            <div className="flex items-center justify-center">
              <button
                onClick={() => onAdd(row.original)}
                className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                title="Add Target"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          );
        }

        return (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => onEdit(row.original)}
              className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors"
              title="Edit Target"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(row.original)}
              className="p-1.5 bg-rose-50 text-rose-600 rounded-md hover:bg-rose-100 transition-colors"
              title="Delete Target"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    }),
  ];
}
