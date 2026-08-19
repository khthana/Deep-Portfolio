/**
 * What an attachment looks like once it has left the API.
 *
 * One table holds two quite different things — an uploaded object in MinIO and
 * a pasted URL — and every read endpoint splits them back apart before
 * answering, which is why the response is two lists rather than one with a
 * discriminant. Six features embed this shape: announcements, course material,
 * activities, learning activities, and both kinds of submission.
 *
 * It moved ahead of all six on purpose: docs/adr/0031-attachments-are-the-leaf.md
 * says why the order of the passes left in #68 is the dependency graph rather
 * than the size of a feature.
 *
 * `AttachmentType` — the FILE/IMAGE/LINK object the upload buttons read — is
 * not here and cannot be: it is a runtime value, and this package compiles to
 * nothing on purpose (ADR-0028 §4). It stays in apps/web.
 */

export type AttachmentDetailResp = {
  file: FileDetail[];
  url: URLDetail[];
};

export type FileDetail = {
  attachment_id: number;
  title: string;
  /**
   * Not the object's key in the bucket: a signed path to `GET /files`, minted
   * on the way out and good for an hour from the second it was signed. A
   * caller that stores one has stored something that stops working — see
   * docs/adr/0006-file-access.md.
   */
  file_path: string;
  original_filename: string;
  /**
   * A BigInt in the column, which `JSON.stringify` refuses outright, so the
   * service reads it through `Number()` — which also turns a row with no size
   * into 0 rather than null.
   */
  file_size: number;
  file_type: string;
  uploaded_at: string | null;
};

export type URLDetail = {
  attachment_id: number;
  title: string;
  url: string;
  uploaded_at: string | null;
};
