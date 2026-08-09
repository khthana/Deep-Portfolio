import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import {
  CreatePortfolioInternshipReqBody,
  PortfolioInternshipResp,
  UpdatePortfolioInternshipReqBody,
} from "../models/portfolio-internship.model";
import AttachmentsService from "./attachments.service";

// Helper to infer the type
const inferInternship = () =>
  prisma.portfolio_internship.findFirst({
    include: {
      portfolio_internship_attachments: {
        include: {
          attachments: true,
        },
      },
    },
  });

type PortfolioInternshipWithAttachments = NonNullable<
  Prisma.PromiseReturnType<typeof inferInternship>
>;

type PortfolioInternshipAttachment = NonNullable<
  PortfolioInternshipResp["attachments"]
>[number];

export default class PortfolioInternshipService {
  private readonly attachmentsService: AttachmentsService;

  constructor() {
    this.attachmentsService = new AttachmentsService();
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

    const updatedInternship = await prisma.portfolio_internship.update({
      where: { id },
      data: updateData,
    });

    if (ids_to_delete && ids_to_delete.length > 0) {
      await prisma.portfolio_internship_attachments.deleteMany({
        where: {
          internship_id: id,
          attachment_id: { in: ids_to_delete },
        },
      });
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
    const result = await prisma.portfolio_internship.delete({
      where: { id },
    });
    return {
      ...result,
      attachments: [],
    };
  }
}
