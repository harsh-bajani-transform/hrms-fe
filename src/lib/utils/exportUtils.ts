import * as XLSX from "xlsx";
import { toast } from "sonner";

/**
 * Shared CSV export utility
 * @param data - The array of objects to export
 * @param filename - The name of the exported file (should end in .csv)
 */
export const exportToCSV = (
  data: Record<string, unknown>[],
  filename: string,
): void => {
  try {
    if (!data || data.length === 0) {
      toast.error("No data to export");
      return;
    }

    // Ensure filename ends in .csv
    const finalFilename = filename.toLowerCase().endsWith(".csv") 
      ? filename 
      : `${filename.split(".")[0]}.csv`;

    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    
    // Create a blob and download it
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", finalFilename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Report exported as ${finalFilename}`);
  } catch (error) {
    console.error("[Export Utils] CSV Export error:", error);
    toast.error("Failed to export CSV report");
  }
};
