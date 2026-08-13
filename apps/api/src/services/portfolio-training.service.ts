import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import {
  CreatePortfolioTrainingReqBody,
  UpdatePortfolioTrainingReqBody,
  PortfolioTrainingResp,
} from "../models/portfolio-training.model";
import AttachmentsService from "./attachments.service";
import MinIOService from "./upload.service";

// The row as every read in this file asks for it: the record plus its
// attachments, reached through the join table. Derived from the schema, so
// a column added to either side arrives here without an edit.
type PortfolioTrainingWithAttachments = Prisma.portfolio_trainingGetPayload<{
  include: {
    portfolio_training_attachments: { include: { attachments: true } };
  };
}>;

type PortfolioTrainingAttachment = NonNullable<
  PortfolioTrainingResp["attachments"]
>[number];

export default class PortfolioTrainingService {
  private readonly attachmentsService: AttachmentsService;
  private readonly uploadService: MinIOService;

  constructor() {
    this.attachmentsService = new AttachmentsService();
    this.uploadService = new MinIOService();
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
        let attachments: PortfolioTrainingAttachment[] = [];
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

    let attachments: PortfolioTrainingAttachment[] = [];
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

    await prisma.portfolio_training.update({
      where: { id },
      data: updateData,
    });

    if (ids_to_delete && ids_to_delete.length > 0) {
      // A join row is what makes an attachment reachable. Dropping the last
      // one strands it, so it goes with the link (#34).
      const objects = await prisma.$transaction(async (tx) => {
        await tx.portfolio_training_attachments.deleteMany({
          where: {
            training_id: id,
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
    const { result, objects } = await prisma.$transaction(async (tx) => {
      // Read what hangs off the entry first: deleting it cascades the join
      // rows away, and they are the only record of which attachments were
      // its own (#34).
      const links = await tx.portfolio_training_attachments.findMany({
        where: { training_id: id },
        select: { attachment_id: true },
      });

      const result = await tx.portfolio_training.delete({
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
