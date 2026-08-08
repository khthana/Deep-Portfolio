import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import {
  CreatePortfolioThesisReqBody,
  UpdatePortfolioThesisReqBody,
  PortfolioThesisResp,
} from "../models/portfolio-thesis.model";
import AttachmentsService from "./attachments.service";

// Helper to infer the type
const inferThesis = () =>
  prisma.portfolio_thesis.findFirst({
    include: {
      portfolio_thesis_attachments: {
        include: {
          attachments: true,
        },
      },
    },
  });

type PortfolioThesisWithAttachments = NonNullable<
  Prisma.PromiseReturnType<typeof inferThesis>
>;

export default class PortfolioThesisService {
  private readonly attachmentsService: AttachmentsService;

  constructor() {
    this.attachmentsService = new AttachmentsService();
  }

  async getAllPortfolioThesis(userId: string): Promise<PortfolioThesisResp[]> {
    const theses = await prisma.portfolio_thesis.findMany({
      where: { user_id: userId },
      include: {
        portfolio_thesis_attachments: {
          include: {
            attachments: true,
          },
        },
      },
      orderBy: { id: "desc" },
    });

    return await Promise.all(
      theses.map(async (thesis: PortfolioThesisWithAttachments) => {
        let attachments: NonNullable<PortfolioThesisResp["attachments"]> = [];
        if (thesis.portfolio_thesis_attachments.length > 0) {
          const attachmentIds = thesis.portfolio_thesis_attachments.map(
            (pta) => ({ attachment_id: pta.attachments.attachment_id }),
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
          id: thesis.id,
          user_id: thesis.user_id,
          name: thesis.name,
          repository: thesis.repository,
          role_and_resp: thesis.role_and_resp,
          init_expect: thesis.init_expect,
          reflection: thesis.reflection,
          is_show_repo: thesis.is_show_repo,
          is_show_role: thesis.is_show_role,
          is_show_init: thesis.is_show_init,
          is_show_reflec: thesis.is_show_reflec,
          attachments,
        };
      }),
    );
  }

  async getPortfolioThesisById(
    id: number,
  ): Promise<PortfolioThesisResp | null> {
    const thesis: PortfolioThesisWithAttachments | null =
      await prisma.portfolio_thesis.findUnique({
        where: { id },
        include: {
          portfolio_thesis_attachments: {
            include: {
              attachments: true,
            },
          },
        },
      });

    if (!thesis) return null;

    let attachments: NonNullable<PortfolioThesisResp["attachments"]> = [];
    if (thesis.portfolio_thesis_attachments.length > 0) {
      const attachmentIds = thesis.portfolio_thesis_attachments.map((pta) => ({
        attachment_id: pta.attachments.attachment_id,
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
      id: thesis.id,
      user_id: thesis.user_id,
      name: thesis.name,
      repository: thesis.repository,
      role_and_resp: thesis.role_and_resp,
      init_expect: thesis.init_expect,
      reflection: thesis.reflection,
      is_show_repo: thesis.is_show_repo,
      is_show_role: thesis.is_show_role,
      is_show_init: thesis.is_show_init,
      is_show_reflec: thesis.is_show_reflec,
      attachments,
    };
  }

  async createPortfolioThesis(
    userId: string,
    data: CreatePortfolioThesisReqBody,
    files: Express.Multer.File[] = [],
  ): Promise<PortfolioThesisResp> {
    const { ...thesisData } = data;

    const thesis = await prisma.portfolio_thesis.create({
      data: {
        user_id: userId,
        ...thesisData,
      },
    });

    if (files && files.length > 0) {
      const attachmentIds = await this.attachmentsService.createAttachments(
        {
          urls: [],
          files: files,
        },
        "portfolio-thesis",
      );

      if (attachmentIds.length > 0) {
        await prisma.portfolio_thesis_attachments.createMany({
          data: attachmentIds.map((attId) => ({
            thesis_id: thesis.id,
            attachment_id: attId,
          })),
        });
      }
    }

    return (await this.getPortfolioThesisById(thesis.id))!;
  }

  async updatePortfolioThesis(
    id: number,
    data: UpdatePortfolioThesisReqBody,
    files: Express.Multer.File[] = [],
  ): Promise<PortfolioThesisResp> {
    const { ids_to_delete, ...updateData } = data;

    const updatedThesis = await prisma.portfolio_thesis.update({
      where: { id },
      data: updateData,
    });

    if (ids_to_delete && ids_to_delete.length > 0) {
      const idsToDelete = Array.isArray(ids_to_delete)
        ? ids_to_delete.map(Number)
        : [Number(ids_to_delete)];

      await prisma.portfolio_thesis_attachments.deleteMany({
        where: {
          thesis_id: id,
          attachment_id: { in: idsToDelete },
        },
      });
    }

    if (files && files.length > 0) {
      const attachmentIds = await this.attachmentsService.createAttachments(
        {
          urls: [],
          files: files,
        },
        "portfolio-thesis",
      );

      if (attachmentIds.length > 0) {
        await prisma.portfolio_thesis_attachments.createMany({
          data: attachmentIds.map((attId) => ({
            thesis_id: id,
            attachment_id: attId,
          })),
        });
      }
    }

    return (await this.getPortfolioThesisById(id))!;
  }

  async deletePortfolioThesis(id: number): Promise<PortfolioThesisResp> {
    const result = await prisma.portfolio_thesis.delete({
      where: { id },
    });
    return {
      ...result,
      attachments: [],
    };
  }
}
