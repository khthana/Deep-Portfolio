/**
 * Utility functions for year conversion between Common Era (C.E.) and Buddhist Era (B.E.)
 * C.E. = B.E. - 543
 * B.E. = C.E. + 543
 */

/**
 * Converts a year from Common Era (C.E.) to Buddhist Era (B.E.) for display.
 * @param year Year in C.E. (e.g., 2024)
 * @returns Year in B.E. (e.g., 2567) or undefined
 */
export const convertToBE = (
  year: number | string | undefined | null,
): number | undefined => {
  if (year === undefined || year === null || year === "") return undefined;
  const yearNum = typeof year === "string" ? parseInt(year, 10) : year;
  if (isNaN(yearNum)) return undefined;
  return yearNum + 543;
};

/**
 * Converts a year from Buddhist Era (B.E.) to Common Era (C.E.) for storage.
 * @param year Year in B.E. (e.g., 2567)
 * @returns Year in C.E. (e.g., 2024) or undefined
 */
export const convertToCE = (
  year: number | string | undefined | null,
): number | undefined => {
  if (year === undefined || year === null || year === "") return undefined;
  const yearNum = typeof year === "string" ? parseInt(year, 10) : year;
  if (isNaN(yearNum)) return undefined;
  return yearNum - 543;
};
