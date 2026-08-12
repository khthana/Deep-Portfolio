import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { FileDetail, URLDetail } from "../models/announcement.model";
import { UploadAttachments } from "../models/attachments.model";
import { formatFileType } from "../utils/format-file-type";
import { signFileUrl } from "../utils/file-url";
import MinIOService from "./upload.service";

/**
 * Runs `work` as one transaction and, if it does not commit, takes back out of
 * the bucket every object `createAttachments` uploaded inside it.
 *
 * A transaction covers rows and nothing else. An upload has already left the
 * process by the time the row naming it is written, so a refusal further down
 * rolled the rows back and left the object in the bucket for good —
 * unreachable, because the only address anybody had for it was the row that
 * went away (#50).
 *
 * `work` is handed the array `createAttachments` records its uploads in. Pass
 * the two on together as `{ tx, uploads }`, the third argument; a call given
 * nothing writes outside the transaction and is not swept up after. The array
 * belongs to this call rather than to a service, so two requests uploading at
 * once cannot take away each other's files.
 *
 * This is the mirror of the delete side (ADR-0008): there the rows go first
 * and the objects follow once the transaction has committed, because an object
 * outliving its row only costs space while a row outliving its object is
 * something the reader sees. Here the object cannot be written last, so it is
 * written first and taken back when the rows never arrive.
 */
export async function transactionWithUploads<T>(
  work: (tx: Prisma.TransactionClient, uploads: string[]) => Promise<T>,
): Promise<T> {
  const uploads: string[] = [];

  try {
    // Awaited inside the try, not returned out of it: a promise handed back
    // unawaited settles where nothing is catching it.
    return await prisma.$transaction((tx) => work(tx, uploads));
  } catch (error) {
    await new MinIOService().removeFiles(uploads);
    throw error;
  }
}

/**
 * The transaction an upload is being made inside, and the array its object
 * keys go into.
 *
 * One parameter rather than two, because either half alone is a mistake the
 * types would otherwise let through: `tx` without `uploads` rolls the rows
 * back and leaves the files in the bucket — the exact failure #50 and #52 were
 * about — and `uploads` without `tx` records keys for rows that were never
 * going to roll back anyway. `transactionWithUploads` hands out both.
 */
export type UploadScope = {
  tx: Prisma.TransactionClient;
  uploads: string[];
};

export default class AttachmentsService {
  private readonly uploadService: MinIOService;

  constructor() {
    this.uploadService = new MinIOService();
  }

  async createAttachments(
    data: UploadAttachments,
    folder: string,
    scope?: UploadScope,
  ) {
    const prismaClient = scope?.tx ?? prisma;

    const attachmentIds: number[] = [];

    if (data.urls.length > 0) {
      await Promise.all(
        data.urls.map(async (url) => {
          const attachment = await prismaClient.attachments.create({
            data: {
              title: url.title,
              attachment_type: "link",
              url: url.url,
            },
          });
          attachmentIds.push(attachment.attachment_id);
        }),
      );
    }

    if (data.files.length > 0) {
      await Promise.all(
        data.files.map(async (file) => {
          const originalName = Buffer.from(
            file.originalname,
            "latin1",
          ).toString("utf8");

          const fileUrl = await this.uploadService.uploadFile(
            {
              ...file,
              originalname: originalName,
            },
            folder,
          );

          // Recorded before the row, and whether or not the row is ever made:
          // the object is in the bucket from here on, and only this array
          // remembers where. See transactionWithUploads.
          if (fileUrl) scope?.uploads.push(fileUrl);

          const attachment = await prismaClient.attachments.create({
            data: {
              title: originalName,
              attachment_type: "file",
              file_path: fileUrl,
              original_filename: originalName,
              file_size: BigInt(file.size),
              file_type: formatFileType(originalName),
            },
          });

          attachmentIds.push(attachment.attachment_id);
        }),
      );
    }

    return attachmentIds;
  }

  /**
   * Deletes the attachments among `attachmentIds` that no record points at any
   * more, and answers with the object keys the bucket still holds for them.
   *
   * Call it after the rows that owned the attachment are gone — the join rows
   * are what makes an attachment referenced, so the count is only right once
   * they have been removed inside the same transaction. The caller hands the
   * keys to `MinIOService.removeFiles` once that transaction has committed.
   *
   * Every table that points at `attachments` has to appear below. A new one
   * that does not will make its attachments look unreferenced and take them
   * out from under itself. See docs/adr/0008-attachment-lifecycle.md.
   */
  async deleteUnreferenced(
    attachmentIds: number[],
    tx?: Prisma.TransactionClient,
  ): Promise<string[]> {
    if (attachmentIds.length === 0) return [];

    const prismaClient = tx ?? prisma;

    const orphans = await prismaClient.attachments.findMany({
      where: {
        attachment_id: { in: attachmentIds },
        activity_attachments: { none: {} },
        announcement_attachments: { none: {} },
        course_material: { none: {} },
        learning_activity_attachments: { none: {} },
        portfolio_activity_attachments: { none: {} },
        portfolio_award_attachments: { none: {} },
        portfolio_certificate_attachments: { none: {} },
        portfolio_internship_attachments: { none: {} },
        portfolio_personal: { none: {} },
        portfolio_thesis_attachments: { none: {} },
        portfolio_training_attachments: { none: {} },
        student_activity_attachments: { none: {} },
        student_learning_activity_attachments: { none: {} },
      },
      select: { attachment_id: true, file_path: true },
    });

    if (orphans.length === 0) return [];

    await prismaClient.attachments.deleteMany({
      where: {
        attachment_id: { in: orphans.map((o) => o.attachment_id) },
      },
    });

    // A link has no object behind it, only a url.
    return orphans
      .map((o) => o.file_path)
      .filter((path): path is string => path !== null);
  }

  async getAttachments(
    attachmentsIds: {
      attachment_id: number;
    }[],
    tx?: Prisma.TransactionClient,
  ) {
    const prismaClient = tx ?? prisma;

    const attachments = await prismaClient.attachments.findMany({
      where: {
        attachment_id: {
          in: attachmentsIds.map((attachment) => attachment.attachment_id),
        },
      },
    });

    const files: FileDetail[] = [];
    const urls: URLDetail[] = [];

    for (const attachment of attachments) {
      if (attachment.attachment_type === "link") {
        urls.push({
          attachment_id: attachment.attachment_id,
          title: attachment.title,
          url: attachment.url!,
          uploaded_at: attachment.uploaded_at,
        });
      } else {
        files.push({
          attachment_id: attachment.attachment_id,
          title: attachment.title,
          // Not the object key. This is the one place a stored file's address
          // leaves the API, so it is the one place the permission to read it
          // can be attached: what goes out is a signed, short-lived path to
          // `GET /files`, and that route serves nothing else. Every caller of
          // this method has already decided whether this request may see the
          // record the attachment hangs off — see docs/adr/0006-file-access.md.
          file_path: signFileUrl(attachment.file_path!),
          file_size: Number(attachment.file_size!),
          file_type: attachment.file_type!,
          original_filename: attachment.original_filename!,
          uploaded_at: attachment.uploaded_at,
        });
      }
    }

    return { file: files, url: urls };
  }
}
