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

  private sanitizeData(
    data: any,
  ): CreatePortfolioPersonalReqBody | UpdatePortfolioPersonalReqBody {
    const sanitized = { ...data };

    for (const key in sanitized) {
      if (sanitized[key] === "null") {
        sanitized[key] = null;
      } else if (sanitized[key] === "") {
        // Allow empty string for email and phone_number to support "deletion" (clearing)
        if (key === "email" || key === "phone_number") {
          sanitized[key] = "";
        } else {
          sanitized[key] = null;
        }
      }
    }

    if (sanitized.date_of_birth && typeof sanitized.date_of_birth === "string") {
      sanitized.date_of_birth = new Date(sanitized.date_of_birth);
    }

    if (sanitized.attachment_id && typeof sanitized.attachment_id === "string") {
      sanitized.attachment_id = parseInt(sanitized.attachment_id, 10);
    }

    return sanitized;
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
      } as any;
    }

    // Fallback to user data if portfolio fields are null. The row the user
    // signed up with is the one they would otherwise have to type in again,
    // and the branch above already answers that way for a user who has no
    // portfolio_personal row at all.
    const result = {
      ...portfolio,
      email: portfolio.email ?? portfolio.users.email,
      phone_number: portfolio.phone_number ?? portfolio.users.phone,
    };

    // The join is how the fallback was reached, not something the caller asked
    // for — PortfolioPersonalResp does not declare it and the frontend does not
    // read it.
    delete (result as any).users;

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
    const sanitizedData = this.sanitizeData(data);

    if (file) {
      const attachmentIds = await this.attachmentsService.createAttachments(
        {
          urls: [],
          files: [file],
        },
        "portfolio-personal",
      );
      if (attachmentIds.length > 0) {
        sanitizedData.attachment_id = attachmentIds[0];
      }
    }

    return await prisma.portfolio_personal.create({
      data: {
        user_id: userId,
        ...sanitizedData,
      },
    });
  }

  async updatePortfolioPersonal(
    userId: string,
    data: UpdatePortfolioPersonalReqBody,
    file?: Express.Multer.File,
  ): Promise<PortfolioPersonalResp> {
    const sanitizedData = this.sanitizeData(data);

    if (file) {
      const attachmentIds = await this.attachmentsService.createAttachments(
        {
          urls: [],
          files: [file],
        },
        "portfolio-personal",
      );
      if (attachmentIds.length > 0) {
        sanitizedData.attachment_id = attachmentIds[0];
      }
    }

    return await prisma.portfolio_personal.update({
      where: { user_id: userId },
      data: sanitizedData,
    });
  }

  async upsertPortfolioPersonal(
    userId: string,
    data: CreatePortfolioPersonalReqBody,
    file?: Express.Multer.File,
  ): Promise<PortfolioPersonalResp> {
    const sanitizedData = this.sanitizeData(data);

    if (file) {
      const attachmentIds = await this.attachmentsService.createAttachments(
        {
          urls: [],
          files: [file],
        },
        "portfolio-personal",
      );
      if (attachmentIds.length > 0) {
        sanitizedData.attachment_id = attachmentIds[0];
      }
    }

    return await prisma.portfolio_personal.upsert({
      where: { user_id: userId },
      update: sanitizedData,
      create: {
        user_id: userId,
        ...sanitizedData,
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
