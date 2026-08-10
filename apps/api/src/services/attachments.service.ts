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
