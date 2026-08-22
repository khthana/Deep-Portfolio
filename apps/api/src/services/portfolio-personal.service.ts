import { Prisma } from "@prisma/client";
import type { portfolio_personal } from "@prisma/client";
import type {
  PortfolioPersonalDetail,
  PortfolioPersonalRow,
} from "@deep-portfolio/api-types";
import prisma from "../config/prisma";
import {
  CreatePortfolioPersonalReqBody,
  UpdatePortfolioPersonalReqBody,
} from "../models/portfolio-personal.model";
import AttachmentsService from "./attachments.service";
import MinIOService from "./upload.service";

/**
 * One row of `portfolio_personal` as a caller reads it.
 *
 * `date_of_birth` is the only column that is not already what the wire says.
 * `JSON.stringify` would turn it into the same string anyway; doing it here is
 * what lets the return types say `string | null` and be true (#68).
 */
const toPortfolioPersonalRow = (
  row: portfolio_personal,
): PortfolioPersonalRow => ({
  ...row,
  date_of_birth: row.date_of_birth?.toISOString() ?? null,
});

export default class PortfolioPersonalService {
  private readonly attachmentsService: AttachmentsService;
  private readonly uploadService: MinIOService;

  constructor() {
    this.attachmentsService = new AttachmentsService();
    this.uploadService = new MinIOService();
  }

  /**
   * The objects left behind when a row stops pointing at the picture it held.
   *
   * The row holds one picture and `attachment_id` is the only way to reach it,
   * so naming a different one — or losing the row altogether — strands the old
   * one where nothing in the UI can get at it. It goes with the pointer (#34).
   * Naming the same picture again changes nothing and sweeps nothing.
   */
  private async releasePicture(
    previous: number | null | undefined,
    current: number | null,
    tx: Prisma.TransactionClient,
  ) {
    if (!previous || previous === current) return [];

    return this.attachmentsService.deleteUnreferenced([previous], tx);
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
  ): Promise<PortfolioPersonalDetail | null> {
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
    // PortfolioPersonalDetail does not declare it and the frontend does not read
    // it. It used to be spread in and then `delete`d back off through an `any`.
    const { users, ...columns } = portfolio;
    const result = {
      ...toPortfolioPersonalRow(columns),
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
  ): Promise<PortfolioPersonalRow> {
    const personal = await this.withUploadedPicture(data, file);

    const row = await prisma.portfolio_personal.create({
      data: {
        user_id: userId,
        ...personal,
      },
    });

    return toPortfolioPersonalRow(row);
  }

  async updatePortfolioPersonal(
    userId: string,
    data: UpdatePortfolioPersonalReqBody,
    file?: Express.Multer.File,
  ): Promise<PortfolioPersonalRow> {
    const personal = await this.withUploadedPicture(data, file);

    const { result, objects } = await prisma.$transaction(async (tx) => {
      const previous = await tx.portfolio_personal.findUnique({
        where: { user_id: userId },
        select: { attachment_id: true },
      });

      const result = await tx.portfolio_personal.update({
        where: { user_id: userId },
        data: personal,
      });

      return {
        result,
        objects: await this.releasePicture(
          previous?.attachment_id,
          result.attachment_id,
          tx,
        ),
      };
    });

    await this.uploadService.removeFiles(objects);

    return toPortfolioPersonalRow(result);
  }

  async upsertPortfolioPersonal(
    userId: string,
    data: CreatePortfolioPersonalReqBody,
    file?: Express.Multer.File,
  ): Promise<PortfolioPersonalRow> {
    const personal = await this.withUploadedPicture(data, file);

    const { result, objects } = await prisma.$transaction(async (tx) => {
      const previous = await tx.portfolio_personal.findUnique({
        where: { user_id: userId },
        select: { attachment_id: true },
      });

      const result = await tx.portfolio_personal.upsert({
        where: { user_id: userId },
        update: personal,
        create: {
          user_id: userId,
          ...personal,
        },
      });

      return {
        result,
        objects: await this.releasePicture(
          previous?.attachment_id,
          result.attachment_id,
          tx,
        ),
      };
    });

    await this.uploadService.removeFiles(objects);

    return toPortfolioPersonalRow(result);
  }

  async deletePortfolioPersonal(userId: string): Promise<PortfolioPersonalRow> {
    const { result, objects } = await prisma.$transaction(async (tx) => {
      const result = await tx.portfolio_personal.delete({
        where: { user_id: userId },
      });

      return {
        result,
        objects: await this.releasePicture(result.attachment_id, null, tx),
      };
    });

    await this.uploadService.removeFiles(objects);

    return toPortfolioPersonalRow(result);
  }
}
