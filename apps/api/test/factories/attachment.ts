import prisma from "../../src/config/prisma";

/**
 * Attachments — one table for two quite different things.
 *
 * `attachment_type: "file"` means a real object was uploaded to MinIO and
 * file_path points at it. `attachment_type: "link"` means someone pasted a URL
 * and nothing was uploaded at all. Everything that carries attachments
 * (announcements, course material, submissions) joins to this table, so the
 * two shapes turn up everywhere and the read endpoints split them back apart.
 *
 * These factories write the row only. A case that needs an object in the
 * bucket as well has to go through the endpoint that uploads one — which is
 * the point, since that path is what the upload cases are about.
 */

export interface FileAttachmentOptions {
  title?: string;
  /** The object key inside the bucket, as MinIOService.uploadFile returns it.
   *  Nothing dereferences it on the read path, so a plausible string is enough
   *  unless the case is about the object itself. */
  file_path?: string;
  original_filename?: string;
  file_size?: number;
  /** The extension, upper-cased and without the dot — that is what the upload
   *  path writes, so the default matches it. */
  file_type?: string;
  /** The column defaults to now(), which is right for every case that does not
   *  care. A case that asserts the value itself passes one, because now() is
   *  not something an expectation can name. */
  uploaded_at?: Date;
}

export function createFileAttachment(options: FileAttachmentOptions = {}) {
  const original_filename = options.original_filename ?? "เอกสารตัวอย่าง.pdf";

  return prisma.attachments.create({
    data: {
      title: options.title ?? original_filename,
      attachment_type: "file",
      file_path: options.file_path ?? `example/${original_filename}`,
      original_filename,
      file_size: BigInt(options.file_size ?? 1024),
      file_type: options.file_type ?? "PDF",
      uploaded_at: options.uploaded_at,
    },
  });
}

export interface LinkAttachmentOptions {
  title?: string;
  url?: string;
  /** As above — the column defaults to now(). */
  uploaded_at?: Date;
}

export function createLinkAttachment(options: LinkAttachmentOptions = {}) {
  return prisma.attachments.create({
    data: {
      title: options.title ?? "ลิงก์ตัวอย่าง",
      attachment_type: "link",
      url: options.url ?? "https://example.test/material",
      uploaded_at: options.uploaded_at,
    },
  });
}
