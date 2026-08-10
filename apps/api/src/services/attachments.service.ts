import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { FileDetail, URLDetail } from "../models/announcement.model";
import { UploadAttachments } from "../models/attachments.model";
import { formatFileType } from "../utils/format-file-type";
import { signFileUrl } from "../utils/file-url";
import MinIOService from "./upload.service";

export default class AttachmentsService {
  private readonly uploadService: MinIOService;

  constructor() {
    this.uploadService = new MinIOService();
  }

  async createAttachments(
    data: UploadAttachments,
    folder: string,
    tx?: Prisma.TransactionClient,
  ) {
    const prismaClient = tx ?? prisma;

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
