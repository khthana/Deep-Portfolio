import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import {
  CreatePortfolioActivityReqBody,
  UpdatePortfolioActivityReqBody,
  PortfolioActivityResp,
} from "../models/portfolio-activity.model";
import AttachmentsService from "./attachments.service";

// Helper to infer the type
const inferActivity = () =>
  prisma.portfolio_activities.findFirst({
    include: {
      portfolio_activity_attachments: {
        include: {
          attachments: true,
        },
      },
    },
  });

type PortfolioActivityWithAttachments = NonNullable<
  Prisma.PromiseReturnType<typeof inferActivity>
>;

export default class PortfolioActivityService {
  private readonly attachmentsService: AttachmentsService;

  constructor() {
    this.attachmentsService = new AttachmentsService();
  }

  async getAllPortfolioActivity(
    userId: string,
  ): Promise<PortfolioActivityResp[]> {
    const activities = await prisma.portfolio_activities.findMany({
      where: { user_id: userId },
      include: {
        portfolio_activity_attachments: {
          include: {
            attachments: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return await Promise.all(
      activities.map(async (activity: PortfolioActivityWithAttachments) => {
        let attachments: any[] = [];
        if (activity.portfolio_activity_attachments.length > 0) {
          const attachmentIds = activity.portfolio_activity_attachments.map(
            (paa) => ({ attachment_id: paa.attachments.attachment_id }),
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
          id: activity.id,
          user_id: activity.user_id,
          name: activity.name,
          date: activity.date,
          role: activity.role,
          description: activity.description,
          is_show: activity.is_show,
          attachments,
        };
      }),
    );
  }

  async getPortfolioActivityById(
    id: number,
  ): Promise<PortfolioActivityResp | null> {
    const activity: PortfolioActivityWithAttachments | null =
      await prisma.portfolio_activities.findUnique({
        where: { id },
        include: {
          portfolio_activity_attachments: {
            include: {
              attachments: true,
            },
          },
        },
      });

    if (!activity) return null;

    let attachments: any[] = [];
    if (activity.portfolio_activity_attachments.length > 0) {
      const attachmentIds = activity.portfolio_activity_attachments.map(
        (paa) => ({ attachment_id: paa.attachments.attachment_id }),
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
      id: activity.id,
      user_id: activity.user_id,
      name: activity.name,
      date: activity.date,
      role: activity.role,
      description: activity.description,
      is_show: activity.is_show,
      attachments,
    };
  }

  async createPortfolioActivity(
    userId: string,
    data: CreatePortfolioActivityReqBody,
    files: Express.Multer.File[] = [],
  ): Promise<PortfolioActivityResp> {
    const { ...activityData } = data;

    const activity = await prisma.portfolio_activities.create({
      data: {
        user_id: userId,
        ...activityData,
      },
    });

    if (files && files.length > 0) {
      const attachmentIds = await this.attachmentsService.createAttachments(
        {
          urls: [],
          files: files,
        },
        "portfolio-activity",
      );

      if (attachmentIds.length > 0) {
        await prisma.portfolio_activity_attachments.createMany({
          data: attachmentIds.map((attId) => ({
            activity_id: activity.id,
            attachment_id: attId,
          })),
        });
      }
    }

    return (await this.getPortfolioActivityById(activity.id))!;
  }

  async updatePortfolioActivity(
    id: number,
    data: UpdatePortfolioActivityReqBody,
    files: Express.Multer.File[] = [],
  ): Promise<PortfolioActivityResp> {
    const { ids_to_delete, ...updateData } = data;

    await prisma.portfolio_activities.update({
      where: { id },
      data: updateData,
    });

    if (ids_to_delete && ids_to_delete.length > 0) {
      const idsToDelete = Array.isArray(ids_to_delete)
        ? ids_to_delete.map(Number)
        : [Number(ids_to_delete)];

      await prisma.portfolio_activity_attachments.deleteMany({
        where: {
          activity_id: id,
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
        "portfolio-activity",
      );

      if (attachmentIds.length > 0) {
        await prisma.portfolio_activity_attachments.createMany({
          data: attachmentIds.map((attId) => ({
            activity_id: id,
            attachment_id: attId,
          })),
        });
      }
    }

    return (await this.getPortfolioActivityById(id))!;
  }

  async deletePortfolioActivity(id: number): Promise<PortfolioActivityResp> {
    const result = await prisma.portfolio_activities.delete({
      where: { id },
    });
    return {
      ...result,
      attachments: [],
    };
  }
}
