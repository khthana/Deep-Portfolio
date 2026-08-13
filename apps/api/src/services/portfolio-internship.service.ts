import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import {
  CreatePortfolioInternshipReqBody,
  PortfolioInternshipResp,
  UpdatePortfolioInternshipReqBody,
} from "../models/portfolio-internship.model";
import AttachmentsService from "./attachments.service";
import MinIOService from "./upload.service";

// The row as every read in this file asks for it: the record plus its
// attachments, reached through the join table. Derived from the schema, so
// a column added to either side arrives here without an edit.
type PortfolioInternshipWithAttachments =
  Prisma.portfolio_internshipGetPayload<{
    include: {
      portfolio_internship_attachments: { include: { attachments: true } };
    };
  }>;

type PortfolioInternshipAttachment = NonNullable<
  PortfolioInternshipResp["attachments"]
>[number];

export default class PortfolioInternshipService {
  private readonly attachmentsService: AttachmentsService;
  private readonly uploadService: MinIOService;

  constructor() {
    this.attachmentsService = new AttachmentsService();
    this.uploadService = new MinIOService();
  }

  async getAllPortfolioInternship(
    userId: string,
  ): Promise<PortfolioInternshipResp[]> {
    const internships = await prisma.portfolio_internship.findMany({
      where: { user_id: userId },
      include: {
        portfolio_internship_attachments: {
          include: {
            attachments: true,
          },
        },
      },
      orderBy: { start_date: "desc" },
    });

    return await Promise.all(
      internships.map(
        async (internship: PortfolioInternshipWithAttachments) => {
          let attachments: PortfolioInternshipAttachment[] = [];
          if (internship.portfolio_internship_attachments.length > 0) {
            const attachmentIds =
              internship.portfolio_internship_attachments.map((pia) => ({
                attachment_id: pia.attachments.attachment_id,
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
            id: internship.id,
            user_id: internship.user_id,
            type: internship.type,
            title: internship.title,
            company: internship.company,
            country: internship.country,
            province: internship.province,
            start_date: internship.start_date,
            end_date: internship.end_date,
            position: internship.position,
            resp: internship.resp,
            is_show_resp: internship.is_show_resp,
            learning_out: internship.learning_out,
            is_show_learning: internship.is_show_learning,
            reflection: internship.reflection,
            is_show_reflec: internship.is_show_reflec,
            attachments,
          };
        },
      ),
    );
  }

  async getPortfolioInternshipById(
    id: number,
  ): Promise<PortfolioInternshipResp | null> {
    const internship: PortfolioInternshipWithAttachments | null =
      await prisma.portfolio_internship.findUnique({
        where: { id },
        include: {
          portfolio_internship_attachments: {
            include: {
              attachments: true,
            },
          },
        },
      });

    if (!internship) return null;

    let attachments: PortfolioInternshipAttachment[] = [];
    if (internship.portfolio_internship_attachments.length > 0) {
      const attachmentIds = internship.portfolio_internship_attachments.map(
        (pia) => ({ attachment_id: pia.attachments.attachment_id }),
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
      id: internship.id,
      user_id: internship.user_id,
      type: internship.type,
      title: internship.title,
      company: internship.company,
      country: internship.country,
      province: internship.province,
      start_date: internship.start_date,
      end_date: internship.end_date,
      position: internship.position,
      resp: internship.resp,
      is_show_resp: internship.is_show_resp,
      learning_out: internship.learning_out,
      is_show_learning: internship.is_show_learning,
      reflection: internship.reflection,
      is_show_reflec: internship.is_show_reflec,
      attachments,
    };
  }

  async createPortfolioInternship(
    userId: string,
    data: CreatePortfolioInternshipReqBody,
    files: Express.Multer.File[] = [],
  ): Promise<PortfolioInternshipResp> {
    const internship = await prisma.portfolio_internship.create({
      data: {
        user_id: userId,
        ...data,
      },
    });

    if (files && files.length > 0) {
      const attachmentIds = await this.attachmentsService.createAttachments(
        {
          urls: [],
          files: files,
        },
        "portfolio-internship",
      );

      if (attachmentIds.length > 0) {
        await prisma.portfolio_internship_attachments.createMany({
          data: attachmentIds.map((attId) => ({
            internship_id: internship.id,
            attachment_id: attId,
          })),
        });
      }
    }

    return (await this.getPortfolioInternshipById(internship.id))!;
  }

  async updatePortfolioInternship(
    id: number,
    data: UpdatePortfolioInternshipReqBody,
    files: Express.Multer.File[] = [],
  ): Promise<PortfolioInternshipResp> {
    const { ids_to_delete, ...updateData } = data;

    await prisma.portfolio_internship.update({
      where: { id },
      data: updateData,
    });

    if (ids_to_delete && ids_to_delete.length > 0) {
      // A join row is what makes an attachment reachable. Dropping the last
      // one strands it, so it goes with the link (#34).
      const objects = await prisma.$transaction(async (tx) => {
        await tx.portfolio_internship_attachments.deleteMany({
          where: {
            internship_id: id,
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
        "portfolio-internship",
      );

      if (attachmentIds.length > 0) {
        await prisma.portfolio_internship_attachments.createMany({
          data: attachmentIds.map((attId) => ({
            internship_id: id,
            attachment_id: attId,
          })),
        });
      }
    }

    return (await this.getPortfolioInternshipById(id))!;
  }

  async deletePortfolioInternship(
    id: number,
  ): Promise<PortfolioInternshipResp> {
    const { result, objects } = await prisma.$transaction(async (tx) => {
      // Read what hangs off the placement first: deleting it cascades the
      // join rows away, and they are the only record of which attachments
      // were its own (#34).
      const links = await tx.portfolio_internship_attachments.findMany({
        where: { internship_id: id },
        select: { attachment_id: true },
      });

      const result = await tx.portfolio_internship.delete({
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
