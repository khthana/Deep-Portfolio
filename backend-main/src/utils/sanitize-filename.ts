import path from "path";

/**
 * Sanitizes a filename by:
 * 1. Replacing spaces with underscores.
 * 2. Removing special characters except for alphanumeric, dots, dashes, and underscores.
 * 3. Normalizing the filename while preserving the extension.
 *
 * @param originalName The original filename to sanitize.
 * @returns The sanitized filename.
 */
export const sanitizeFilename = (originalName: string): string => {
  // Extract extension and name without extension
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);

  // 1. Replace spaces with underscores
  // 2. Remove special characters (keep alphanumeric, including Thai/Unicode via \p{L}, dots, dashes, underscores)
  // We use \p{L} for letters and \p{N} for numbers (requires u flag)
  const sanitizedName = nameWithoutExt
    .replace(/\s+/g, "_")
    .replace(/[^\p{L}\p{N}._-]/gu, "");

  // Combine back with extension (also sanitize extension just in case)
  const sanitizedExt = ext.replace(/[^\p{L}\p{N}.]/gu, "");

  return `${sanitizedName}${sanitizedExt}`;
};
