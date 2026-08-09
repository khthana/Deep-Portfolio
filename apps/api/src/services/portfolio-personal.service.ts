import prisma from "../config/prisma";
import {
  CreatePortfolioPersonalReqBody,
  UpdatePortfolioPersonalReqBody,
  PortfolioPersonalResp,
} from "../models/portfolio-personal.model";
import AttachmentsService from "./attachments.service";

export default class PortfolioPersonalService {
  private readonly attachmentsService: AttachmentsService;

  constructor() {
    this.attachmentsService = new AttachmentsService();
  }

  /**
   * The uploaded picture, folded into the fields the caller sent.
   *
   * An upload wins over an `attachment_id` in the body: the file becomes an
   * attachment row and its id replaces whatever the field said. With no file
   * the fields go through untouched — the clearing pass that used to live here,
   * turning `""` and the string `"null"` into NULL over the keys of an `any`,
   * is now part of the schema, where each column keeps its own type.
   */
  private async withUploadedPicture(
    data: CreatePortfolioPersonalReqBody | UpdatePortfolioPersonalReqBody,
    file?: Express.Multer.File,
  ) {
    if (!file) {
      return data;
    }

    const attachmentIds = await this.attachmentsService.createAttachments(
      { urls: [], files: [file] },
      "portfolio-personal",
    );

    return attachmentIds.length > 0
      ? { ...data, attachment_id: attachmentIds[0] }
      : data;
  }

  async getPortfolioPersonal(
    userId: string,
  ): Promise<PortfolioPersonalResp | null> {
    const portfolio = await prisma.portfolio_personal.findUnique({
      where: { user_id: userId },
      include: {
        users: {
          select: {
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!portfolio) {
      // If no portfolio record, try to get at least user defaults
      const user = await prisma.users.findUnique({
        where: { user_id: userId },
        select: { email: true, phone: true },
      });

      if (!user) return null;

      return {
        user_id: userId,
        email: user.email,
        phone_number: user.phone,
        date_of_birth: null,
        nationality: null,
        race: null,
        github: null,
        linkedin: null,
        attachment_id: null,
        attachments: null,
      };
    }

    // Fallback to user data if portfolio fields are null. The row the user
    // signed up with is the one they would otherwise have to type in again,
    // and the branch above already answers that way for a user who has no
    // portfolio_personal row at all.
    //
    // `users` is destructured off rather than spread: the join is how the
    // fallback was reached, not something the caller asked for —
    // PortfolioPersonalResp does not declare it and the frontend does not read
    // it. It used to be spread in and then `delete`d back off through an `any`.
    const { users, ...columns } = portfolio;
    const result = {
      ...columns,
      email: portfolio.email ?? users.email,
      phone_number: portfolio.phone_number ?? users.phone,
    };

    let attachments = null;
    if (portfolio.attachment_id) {
      const stored = await this.attachmentsService.getAttachments([
        { attachment_id: portfolio.attachment_id },
      ]);

      if (stored.file.length > 0) {
        attachments = {
          attachment_id: stored.file[0].attachment_id,
          url: stored.file[0].file_path,
          file_path: stored.file[0].file_path,
        };
      } else if (stored.url.length > 0) {
        attachments = {
          attachment_id: stored.url[0].attachment_id,
          url: stored.url[0].url,
          file_path: null,
        };
      }
    }

    return {
      ...result,
      attachments,
    };
  }

  async createPortfolioPersonal(
    userId: string,
    data: CreatePortfolioPersonalReqBody,
    file?: Express.Multer.File,
  ): Promise<PortfolioPersonalResp> {
    const personal = await this.withUploadedPicture(data, file);

    return await prisma.portfolio_personal.create({
      data: {
        user_id: userId,
        ...personal,
      },
    });
  }

  async updatePortfolioPersonal(
    userId: string,
    data: UpdatePortfolioPersonalReqBody,
    file?: Express.Multer.File,
  ): Promise<PortfolioPersonalResp> {
    const personal = await this.withUploadedPicture(data, file);

    return await prisma.portfolio_personal.update({
      where: { user_id: userId },
      data: personal,
    });
  }

  async upsertPortfolioPersonal(
    userId: string,
    data: CreatePortfolioPersonalReqBody,
    file?: Express.Multer.File,
  ): Promise<PortfolioPersonalResp> {
    const personal = await this.withUploadedPicture(data, file);

    return await prisma.portfolio_personal.upsert({
      where: { user_id: userId },
      update: personal,
      create: {
        user_id: userId,
        ...personal,
      },
    });
  }

  async deletePortfolioPersonal(
    userId: string,
  ): Promise<PortfolioPersonalResp> {
    return await prisma.portfolio_personal.delete({
      where: { user_id: userId },
    });
  }
}
