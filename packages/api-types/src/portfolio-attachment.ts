/**
 * What the e-Portfolio's sections hang off themselves.
 *
 * Six sections — training, certificates, awards, the thesis, activities and
 * internships — each answer a flat list of these, and each had written the
 * shape out for itself. It is not `AttachmentDetailResp`: that keeps files and
 * links in two lists of their own shapes, and this is the two flattened into
 * one, with the fields renamed as they go.
 *
 * The flattening is what decides the nullability, so it is worth reading:
 *
 * - a stored file becomes `{ url: file_path, file_path, original_filename,
 *   file_size }`
 * - a link becomes `{ url, file_path: null, original_filename: title,
 *   file_size: null }`
 *
 * So `url` and `original_filename` are never null — both branches always have
 * something to put there — while `file_path` and `file_size` are null for
 * exactly the links. Twelve of the thirteen copies said all four were nullable;
 * the thirteenth, the thesis's on the web, knew the first two were not and had
 * `file_size` as a string (#68).
 *
 * `original_filename` is non-null here the same way it is non-null on
 * `FileDetail`, which is to say by assumption rather than by column: the column
 * takes null and `attachments.service.ts` asserts it away with a `!`, along with
 * `file_path`, `file_size` and `file_type`. This type inherits that assumption
 * rather than making a new one. On the link side it is `URLDetail.title`, which
 * the column really does refuse to leave empty.
 *
 * `url` for a file is a signed path good for an hour, not a bucket key — see
 * docs/adr/0006-file-access.md before storing one.
 */
export type PortfolioSectionAttachment = {
  attachment_id: number;
  url: string;
  file_path: string | null;
  original_filename: string;
  file_size: number | null;
};
