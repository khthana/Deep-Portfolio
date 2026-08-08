import { describe, expect, it } from "vitest";
import { formatFileType } from "./format-file-type";

/**
 * The badge an attachment is labelled with — "PDF", "PNG".
 *
 * It is handed a file *name*, not a MIME type, despite the parameter being
 * called `type`: the one caller passes `attachmentItems.name`.
 */

describe("formatFileType", () => {
  it("upper-cases the extension", () => {
    expect(formatFileType("report.pdf")).toBe("PDF");
    expect(formatFileType("diagram.PNG")).toBe("PNG");
  });

  it("takes the last extension of a name with several dots", () => {
    expect(formatFileType("lecture.notes.tar.gz")).toBe("GZ");
  });

  it("returns an empty string for an empty name", () => {
    expect(formatFileType("")).toBe("");
  });

  it("returns the whole name when there is no extension", () => {
    // Pinned, not endorsed. `"README".split(".")` is `["README"]`, so the name
    // itself is what ends up on the badge.
    expect(formatFileType("README")).toBe("README");
  });

  it("returns an empty string for a name ending in a dot", () => {
    expect(formatFileType("report.")).toBe("");
  });

  it("upper-cases a Thai file name it cannot find an extension in", () => {
    expect(formatFileType("ใบประกาศ")).toBe("ใบประกาศ");
  });
});
