/**
 * Shared date utility functions
 */

/**
 * Returns the current date in YYYY-MM-DD format.
 */
export const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split("T")[0] ?? "";
};

/**
 * Safe reformatting of dates.
 * Specifically handles conversion from DD-MM-YYYY to YYYY-MM-DD.
 * @param date - The date string to reformat
 */
export const reformatDateForBackend = (
  date: string | null | undefined,
): string => {
  if (!date) return "";

  const trimmedDate = String(date).trim();

  // Pattern 1: YYYY-MM-DD (already correct)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
    return trimmedDate;
  }

  // Pattern 2: DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmedDate)) {
    const parts = trimmedDate.split("-");
    if (parts[0] && parts[1] && parts[2]) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  // Pattern 3: DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmedDate)) {
    const parts = trimmedDate.split("/");
    if (parts[0] && parts[1] && parts[2]) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  // Pattern 4: YYYY/MM/DD
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(trimmedDate)) {
    return trimmedDate.replace(/\//g, "-");
  }

  // Fallback: Try Extracting YYYY-MM-DD from any timestamp (e.g. 2026-02-05 15:00:00)
  const isoMatch = trimmedDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch && isoMatch[1] && isoMatch[2] && isoMatch[3]) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // Use Date object for ISO or other parsable formats
  const d = new Date(trimmedDate);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return trimmedDate;
};
