import React from "react";
import { Plus } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SearchableSelect from "../../../../components/common/SearchableSelect";
import MultiSelectWithCheckbox from "../../../../components/common/MultiSelectWithCheckbox";
import type { AFDData, FormRow, ErrorSelection, PendingSelection } from "../../types";

export interface CreateQCFormColumnsParams {
  afdData: AFDData | null;
  dynamicKeys: string[];
  pendingSelections: Record<string | number, PendingSelection>;
  setPendingSelections: React.Dispatch<
    React.SetStateAction<Record<string | number, PendingSelection>>
  >;
  handleAddError: (rowId: string | number) => void;
  handleRemoveError: (rowId: string | number, errorIndex: number) => void;
  calculateRecordScore: (row: FormRow, afd: AFDData | null) => number;
  getCategoryScore: (row: FormRow, categoryId: number) => number;
}

export const createQCFormColumns = ({
  afdData,
  dynamicKeys,
  pendingSelections,
  setPendingSelections,
  handleAddError,
  handleRemoveError,
  calculateRecordScore,
  getCategoryScore,
}: CreateQCFormColumnsParams): ColumnDef<FormRow>[] => {
  if (!afdData) return [];

  const cols: ColumnDef<FormRow>[] = [
    {
      header: "Sr. No.",
      id: "srNo",
      cell: ({ row }) => (
        <span className="font-semibold text-slate-700">{row.index + 1}</span>
      ),
    },
    ...dynamicKeys.map((key) => ({
      header: key.replace(/_/g, " "),
      id: key,
      cell: ({ row }: { row: { original: FormRow } }) => {
        const val =
          (row.original.originalData as Record<string, unknown>)[key] ?? "";
        return (
          <div
            className="truncate max-w-[150px] text-slate-600"
            title={String(val)}
          >
            {String(val)}
          </div>
        );
      },
    })),
    {
      header: "Select Error",
      id: "selectError",
      cell: ({ row }) => {
        const rowData = row.original;
        const pending = pendingSelections[rowData.id];
        return (
          <div className="flex flex-col gap-2 min-w-[220px] py-2">
            <SearchableSelect
              value={pending?.category || ""}
              onChange={(value) =>
                setPendingSelections((prev) => ({
                  ...prev,
                  [rowData.id]: {
                    category: String(value || ""),
                    subcategories: [],
                  },
                }))
              }
              options={
                afdData.categories.map((cat) => ({
                  value: cat.qc_afd_id,
                  label: cat.name,
                })) || []
              }
              placeholder="Select Category"
            />

            <MultiSelectWithCheckbox
              value={pending?.subcategories || []}
              onChange={(values) =>
                setPendingSelections((prev) => ({
                  ...prev,
                  [rowData.id]: {
                    category: prev[rowData.id]?.category || "",
                    subcategories: values as number[],
                  },
                }))
              }
              options={(() => {
                const catId = pending?.category;
                if (!catId) return [];
                return (
                  afdData.categories
                    .find((c) => c.qc_afd_id === Number(catId))
                    ?.subcategories.map((s) => ({
                      value: s.qc_afd_id,
                      label: `${s.name} (-${s.points} pts)`,
                    })) || []
                );
              })()}
              placeholder="Select Errors"
              disabled={!pending?.category}
            />

            <Button
              onClick={() => handleAddError(rowData.id)}
              disabled={!pending?.category || !pending?.subcategories?.length}
              className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Error
            </Button>
          </div>
        );
      },
    },
    {
      header: "Selected Errors",
      id: "selectedErrors",
      cell: ({ row }) => {
        const rowData = row.original;
        return (
          <div className="flex flex-col gap-1.5 max-w-[200px] py-1">
            {rowData.errors.length > 0 ? (
              rowData.errors.map((error: ErrorSelection, idx) => {
                const category = afdData.categories.find(
                  (c) => c.qc_afd_id === error.categoryId,
                );
                const sub = category?.subcategories.find(
                  (s) => s.qc_afd_id === error.subcategoryId,
                );
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-1 bg-red-50 border border-red-200 px-2 py-1 rounded text-[11px]"
                  >
                    <span className="font-medium text-red-800 truncate">
                      {sub?.name} (-{sub?.points})
                    </span>
                    <button
                      onClick={() => handleRemoveError(rowData.id, idx)}
                      className="text-red-500 hover:text-red-700 font-bold ml-1"
                    >
                      ×
                    </button>
                  </div>
                );
              })
            ) : (
              <span className="text-xs text-slate-400 italic">No errors</span>
            )}
          </div>
        );
      },
    },
    ...afdData.categories.map((cat) => ({
      header: cat.name,
      id: `cat_${cat.qc_afd_id}`,
      cell: ({ row }: { row: { original: FormRow } }) => {
        const score = getCategoryScore(row.original, cat.qc_afd_id);
        return (
          <div className="flex justify-center">
            <Badge
              variant="outline"
              className={`font-bold text-xs min-w-[55px] justify-center border-2 ${
                score === 100
                  ? "text-green-600 border-green-600"
                  : score >= 80
                    ? "text-yellow-600 border-yellow-600"
                    : "text-red-600 border-red-600"
              }`}
            >
              {score}%
            </Badge>
          </div>
        );
      },
    })),
    {
      header: "Record Score",
      id: "recordScore",
      cell: ({ row }) => {
        const score = calculateRecordScore(row.original, afdData);
        return (
          <div className="flex justify-center">
            <Badge
              variant="outline"
              className={`font-bold text-xs min-w-[55px] justify-center border-2 ${
                score >= 95
                  ? "text-green-600 border-green-600"
                  : score >= 80
                    ? "text-yellow-600 border-yellow-600"
                    : "text-red-600 border-red-600"
              }`}
            >
              {score.toFixed(0)}%
            </Badge>
          </div>
        );
      },
    },
  ];
  return cols;
};
