import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import {
  CreatePortfolioAwardReqBody,
  UpdatePortfolioAwardReqBody,
  PortfolioAwardResp,
} from "../models/portfolio-award.model";
import AttachmentsService from "./attachments.service";

// Helper to infer the type
const inferAward = () =>
  prisma.portfolio_award.findFirst({
    include: {
      portfolio_award_attachments: {
        include: {
          attachments: true,
        },
      },
    },
  });

type PortfolioAwardWithAttachments = NonNullable<
  Prisma.PromiseReturnType<typeof inferAward>
>;

type PortfolioAwardAttachment = NonNullable<
  PortfolioAwardResp["attachments"]
>[number];

export default class PortfolioAwardService {
  private readonly attachmentsService: AttachmentsService;

  constructor() {
    this.attachmentsService = new AttachmentsService();
  }

  async getAllPortfolioAward(userId: string): Promise<PortfolioAwardResp[]> {
    const awards = await prisma.portfolio_award.findMany({
      where: { user_id: userId },
      include: {
        portfolio_award_attachments: {
          include: {
            attachments: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return await Promise.all(
      awards.map(async (award: PortfolioAwardWithAttachments) => {
        let attachments: PortfolioAwardAttachment[] = [];
        if (award.portfolio_award_attachments.length > 0) {
          const attachmentIds = award.portfolio_award_attachments.map(
            (paa) => ({
              attachment_id: paa.attachments.attachment_id,
            }),
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
          id: award.id,
          user_id: award.user_id,
          organize: award.organize,
          name: award.name,
          award: award.award,
          date: award.date,
          description: award.description,
          is_show: award.is_show,
          attachments,
        };
      }),
    );
  }

  async getPortfolioAwardById(id: number): Promise<PortfolioAwardResp | null> {
    const award: PortfolioAwardWithAttachments | null =
      await prisma.portfolio_award.findUnique({
        where: { id },
        include: {
          portfolio_award_attachments: {
            include: {
              attachments: true,
            },
          },
        },
      });

    if (!award) return null;

    let attachments: PortfolioAwardAttachment[] = [];
    if (award.portfolio_award_attachments.length > 0) {
      const attachmentIds = award.portfolio_award_attachments.map((paa) => ({
        attachment_id: paa.attachments.attachment_id,
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
      id: award.id,
      user_id: award.user_id,
      organize: award.organize,
      name: award.name,
      award: award.award,
      date: award.date,
      description: award.description,
      is_show: award.is_show,
      attachments,
    };
  }

  async createPortfolioAward(
    userId: string,
    data: CreatePortfolioAwardReqBody,
    files: Express.Multer.File[] = [],
  ): Promise<PortfolioAwardResp> {
    const { date, is_show, ...awardData } = data;

    const award = await prisma.portfolio_award.create({
      data: {
        user_id: userId,
        date: date ?? null,
        ...awardData,

        // An award created without `is_show` is hidden, which is not what the
        // column's default says and not what the other sections do. Pinned in
        // BEHAVIOR-CHANGES.md since #17 and kept deliberately: what a missing
        // flag ought to mean is a decision, not a defect to fix in passing.
        is_show: is_show === true,
      },
    });

    if (files && files.length > 0) {
      const attachmentIds = await this.attachmentsService.createAttachments(
        {
          urls: [],
          files: files,
        },
        "portfolio-award",
      );

      if (attachmentIds.length > 0) {
        await prisma.portfolio_award_attachments.createMany({
          data: attachmentIds.map((attId) => ({
            award_id: award.id,
            attachment_id: attId,
          })),
        });
      }
    }

    return (await this.getPortfolioAwardById(award.id))!;
  }

  async updatePortfolioAward(
    id: number,
    data: UpdatePortfolioAwardReqBody,
    files: Express.Multer.File[] = [],
  ): Promise<PortfolioAwardResp> {
    const { ids_to_delete, ...updateData } = data;

    const updatedAward = await prisma.portfolio_award.update({
      where: { id },
      data: updateData,
    });

    if (ids_to_delete && ids_to_delete.length > 0) {
      await prisma.portfolio_award_attachments.deleteMany({
        where: {
          award_id: id,
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
        "portfolio-award",
      );

      if (attachmentIds.length > 0) {
        await prisma.portfolio_award_attachments.createMany({
          data: attachmentIds.map((attId) => ({
            award_id: id,
            attachment_id: attId,
          })),
        });
      }
    }

    return (await this.getPortfolioAwardById(id))!;
  }

  async deletePortfolioAward(id: number): Promise<PortfolioAwardResp> {
    const result = await prisma.portfolio_award.delete({
      where: { id },
    });
    return {
      ...result,
      is_show: result.is_show,
      attachments: [],
    };
  }
}
