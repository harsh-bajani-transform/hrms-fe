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

  const formattedDate = String(date);

  // If it's already in YYYY-MM-DD or doesn't have hyphens, return as is
  if (!formattedDate.includes("-")) return formattedDate;

  const parts = formattedDate.split("-");

  // If format is DD-MM-YYYY (parts[0] is DD <= 31, parts[2] is YYYY > 31)
  if (
    parts.length === 3 &&
    parts[0] &&
    parts[1] &&
    parts[2] &&
    parseInt(parts[0]) <= 31 &&
    parseInt(parts[2]) > 31
  ) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  return formattedDate;
};
