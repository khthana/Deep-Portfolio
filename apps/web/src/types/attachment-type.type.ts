/**
 * What is left of this file after #68 moved the response shapes out.
 *
 * `AttachmentDetailResp`, `FileDetail` and `URLDetail` live in
 * `@deep-portfolio/api-types` now — import them from there. What stays is the
 * value below, which the upload buttons read at runtime and so cannot go into
 * a package that compiles to nothing (ADR-0028 §4, ADR-0031).
 */

export const AttachmentType = {
  FILE: "FILE",
  IMAGE: "IMAGE",
  LINK: "LINK",
} as const;

export type AttachmentType = keyof typeof AttachmentType;
