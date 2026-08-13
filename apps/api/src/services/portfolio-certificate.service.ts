import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import {
  CreatePortfolioCertificateReqBody,
  UpdatePortfolioCertificateReqBody,
  PortfolioCertificateResp,
} from "../models/portfolio-certificate.model";
import AttachmentsService from "./attachments.service";
import MinIOService from "./upload.service";

// The row as every read in this file asks for it: the record plus its
// attachments, reached through the join table. Derived from the schema, so
// a column added to either side arrives here without an edit.
type PortfolioCertificateWithAttachments =
  Prisma.portfolio_certificateGetPayload<{
    include: {
      portfolio_certificate_attachments: { include: { attachments: true } };
    };
  }>;

type PortfolioCertificateAttachment = NonNullable<
  PortfolioCertificateResp["attachments"]
>[number];

export default class PortfolioCertificateService {
  private readonly attachmentsService: AttachmentsService;
  private readonly uploadService: MinIOService;

  constructor() {
    this.attachmentsService = new AttachmentsService();
    this.uploadService = new MinIOService();
  }

  async getAllPortfolioCertificate(
    userId: string,
  ): Promise<PortfolioCertificateResp[]> {
    const certificates = await prisma.portfolio_certificate.findMany({
      where: { user_id: userId },
      include: {
        portfolio_certificate_attachments: {
          include: {
            attachments: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return await Promise.all(
      certificates.map(
        async (certificate: PortfolioCertificateWithAttachments) => {
          let attachments: PortfolioCertificateAttachment[] = [];
          if (certificate.portfolio_certificate_attachments.length > 0) {
            const attachmentIds =
              certificate.portfolio_certificate_attachments.map((pca) => ({
                attachment_id: pca.attachments.attachment_id,
              }));

            const result =
              await this.attachmentsService.getAttachments(attachmentIds);

            const files = result.file.map((f) => ({
              attachment_id: f.attachment_id,
              url: f.file_path,
              file_path: f.file_path,
              original_filename: f.original_filename,
              file_size: f.file_size,
            }));

            const urls = result.url.map((u) => ({
              attachment_id: u.attachment_id,
              url: u.url,
              file_path: null,
              original_filename: u.title,
              file_size: null,
            }));

            attachments = [...files, ...urls];
          }

          return {
            id: certificate.id,
            user_id: certificate.user_id,
            date: certificate.date,
            organize: certificate.organize,
            name: certificate.name,
            description: certificate.description,
            is_show: certificate.is_show,
            attachments,
          };
        },
      ),
    );
  }

  async getPortfolioCertificateById(
    id: number,
  ): Promise<PortfolioCertificateResp | null> {
    const certificate: PortfolioCertificateWithAttachments | null =
      await prisma.portfolio_certificate.findUnique({
        where: { id },
        include: {
          portfolio_certificate_attachments: {
            include: {
              attachments: true,
            },
          },
        },
      });

    if (!certificate) return null;

    let attachments: PortfolioCertificateAttachment[] = [];
    if (certificate.portfolio_certificate_attachments.length > 0) {
      const attachmentIds = certificate.portfolio_certificate_attachments.map(
        (pca) => ({ attachment_id: pca.attachments.attachment_id }),
      );

      const result =
        await this.attachmentsService.getAttachments(attachmentIds);

      const files = result.file.map((f) => ({
        attachment_id: f.attachment_id,
        url: f.file_path,
        file_path: f.file_path,
        original_filename: f.original_filename,
        file_size: f.file_size,
      }));

      const urls = result.url.map((u) => ({
        attachment_id: u.attachment_id,
        url: u.url,
        file_path: null,
        original_filename: u.title,
        file_size: null,
      }));

      attachments = [...files, ...urls];
    }

    return {
      id: certificate.id,
      user_id: certificate.user_id,
      date: certificate.date,
      organize: certificate.organize,
      name: certificate.name,
      description: certificate.description,
      is_show: certificate.is_show,
      attachments,
    };
  }

  async createPortfolioCertificate(
    userId: string,
    data: CreatePortfolioCertificateReqBody,
    files: Express.Multer.File[] = [],
  ): Promise<PortfolioCertificateResp> {
    const { date, ...certificateData } = data;

    const certificate = await prisma.portfolio_certificate.create({
      data: {
        user_id: userId,
        date: date ?? null,
        ...certificateData,
      },
    });

    if (files && files.length > 0) {
      const attachmentIds = await this.attachmentsService.createAttachments(
        {
          urls: [],
          files: files,
        },
        "portfolio-certificate",
      );

      if (attachmentIds.length > 0) {
        await prisma.portfolio_certificate_attachments.createMany({
          data: attachmentIds.map((attId) => ({
            certificate_id: certificate.id,
            attachment_id: attId,
          })),
        });
      }
    }

    return (await this.getPortfolioCertificateById(certificate.id))!;
  }

  async updatePortfolioCertificate(
    id: number,
    data: UpdatePortfolioCertificateReqBody,
    files: Express.Multer.File[] = [],
  ): Promise<PortfolioCertificateResp> {
    const { ids_to_delete, ...updateData } = data;

    await prisma.portfolio_certificate.update({
      where: { id },
      data: updateData,
    });

    if (ids_to_delete && ids_to_delete.length > 0) {
      // A join row is what makes an attachment reachable. Dropping the last
      // one strands it, so it goes with the link (#34).
      const objects = await prisma.$transaction(async (tx) => {
        await tx.portfolio_certificate_attachments.deleteMany({
          where: {
            certificate_id: id,
            attachment_id: { in: ids_to_delete },
          },
        });

        return this.attachmentsService.deleteUnreferenced(ids_to_delete, tx);
      });

      await this.uploadService.removeFiles(objects);
    }

    if (files && files.length > 0) {
      const attachmentIds = await this.attachmentsService.createAttachments(
        {
          urls: [],
          files: files,
        },
        "portfolio-certificate",
      );

      if (attachmentIds.length > 0) {
        await prisma.portfolio_certificate_attachments.createMany({
          data: attachmentIds.map((attId) => ({
            certificate_id: id,
            attachment_id: attId,
          })),
        });
      }
    }

    return (await this.getPortfolioCertificateById(id))!;
  }

  async deletePortfolioCertificate(
    id: number,
  ): Promise<PortfolioCertificateResp> {
    const { result, objects } = await prisma.$transaction(async (tx) => {
      // Read what hangs off the certificate first: deleting it cascades the
      // join rows away, and they are the only record of which attachments
      // were its own (#34).
      const links = await tx.portfolio_certificate_attachments.findMany({
        where: { certificate_id: id },
        select: { attachment_id: true },
      });

      const result = await tx.portfolio_certificate.delete({
        where: { id },
      });

      return {
        result,
        objects: await this.attachmentsService.deleteUnreferenced(
          links.map((link) => link.attachment_id),
          tx,
        ),
      };
    });

    await this.uploadService.removeFiles(objects);

    return {
      ...result,
      attachments: [],
    };
  }
}
