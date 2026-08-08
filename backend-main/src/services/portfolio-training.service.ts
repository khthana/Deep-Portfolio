import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import {
  CreatePortfolioTrainingReqBody,
  UpdatePortfolioTrainingReqBody,
  PortfolioTrainingResp,
} from "../models/portfolio-training.model";
import AttachmentsService from "./attachments.service";

// Helper to infer the type
const inferTraining = () =>
  prisma.portfolio_training.findFirst({
    include: {
      portfolio_training_attachments: {
        include: {
          attachments: true,
        },
      },
    },
  });

type PortfolioTrainingWithAttachments = NonNullable<
  Prisma.PromiseReturnType<typeof inferTraining>
>;

export default class PortfolioTrainingService {
  private readonly attachmentsService: AttachmentsService;

  constructor() {
    this.attachmentsService = new AttachmentsService();
  }

  async getAllPortfolioTraining(
    userId: string,
  ): Promise<PortfolioTrainingResp[]> {
    const trainings = await prisma.portfolio_training.findMany({
      where: { user_id: userId },
      include: {
        portfolio_training_attachments: {
          include: {
            attachments: true,
          },
        },
      },
      orderBy: { year: "desc" },
    });

    return await Promise.all(
      trainings.map(async (training: PortfolioTrainingWithAttachments) => {
        let attachments: any[] = [];
        if (training.portfolio_training_attachments.length > 0) {
          const attachmentIds = training.portfolio_training_attachments.map(
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
          id: training.id,
          user_id: training.user_id,
          year: training.year,
          country: training.country,
          organize: training.organize,
          name: training.name,
          description: training.description,
          is_show: training.is_show,
          attachments,
        };
      }),
    );
  }

  async getPortfolioTrainingById(
    id: number,
  ): Promise<PortfolioTrainingResp | null> {
    const training: PortfolioTrainingWithAttachments | null =
      await prisma.portfolio_training.findUnique({
        where: { id },
        include: {
          portfolio_training_attachments: {
            include: {
              attachments: true,
            },
          },
        },
      });

    if (!training) return null;

    let attachments: any[] = [];
    if (training.portfolio_training_attachments.length > 0) {
      const attachmentIds = training.portfolio_training_attachments.map(
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
      id: training.id,
      user_id: training.user_id,
      year: training.year,
      country: training.country,
      organize: training.organize,
      name: training.name,
      description: training.description,
      is_show: training.is_show,
      attachments,
    };
  }

  async createPortfolioTraining(
    userId: string,
    data: CreatePortfolioTrainingReqBody,
    files: Express.Multer.File[] = [],
  ): Promise<PortfolioTrainingResp> {
    const { ...trainingData } = data;

    const training = await prisma.portfolio_training.create({
      data: {
        user_id: userId,
        ...trainingData,
      },
    });

    if (files && files.length > 0) {
      const attachmentIds = await this.attachmentsService.createAttachments(
        {
          urls: [],
          files: files,
        },
        "portfolio-training",
      );

      if (attachmentIds.length > 0) {
        await prisma.portfolio_training_attachments.createMany({
          data: attachmentIds.map((attId) => ({
            training_id: training.id,
            attachment_id: attId,
          })),
        });
      }
    }

    return (await this.getPortfolioTrainingById(training.id))!;
  }

  async updatePortfolioTraining(
    id: number,
    data: UpdatePortfolioTrainingReqBody,
    files: Express.Multer.File[] = [],
  ): Promise<PortfolioTrainingResp> {
    const { ids_to_delete, ...updateData } = data;

    const updatedTraining = await prisma.portfolio_training.update({
      where: { id },
      data: updateData,
    });

    if (ids_to_delete && ids_to_delete.length > 0) {
      const idsToDelete = Array.isArray(ids_to_delete)
        ? ids_to_delete.map(Number)
        : [Number(ids_to_delete)];

      await prisma.portfolio_training_attachments.deleteMany({
        where: {
          training_id: id,
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
        "portfolio-training",
      );

      if (attachmentIds.length > 0) {
        await prisma.portfolio_training_attachments.createMany({
          data: attachmentIds.map((attId) => ({
            training_id: id,
            attachment_id: attId,
          })),
        });
      }
    }

    return (await this.getPortfolioTrainingById(id))!;
  }

  async deletePortfolioTraining(id: number): Promise<PortfolioTrainingResp> {
    const result = await prisma.portfolio_training.delete({
      where: { id },
    });
    return {
      ...result,
      attachments: [],
    };
  }
}
