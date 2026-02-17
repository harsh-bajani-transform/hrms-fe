import * as XLSX from "xlsx";
import { toast } from "sonner";

/**
 * Shared Excel export utility
 * @param data - The array of objects to export
 * @param filename - The name of the exported file
 * @param sheetName - The name of the worksheet (optional)
 */
export const exportToExcel = (
  data: Record<string, any>[],
  filename: string,
  sheetName: string = "Sheet 1",
): void => {
  try {
    if (!data || data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    XLSX.writeFile(workbook, filename);
    toast.success("Excel report exported successfully!");
  } catch (error) {
    console.error("[Excel Utils] Export error:", error);
    toast.error("Failed to export Excel report");
  }
};
