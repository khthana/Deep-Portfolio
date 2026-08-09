import { NextFunction, Request, Response } from "express";
import { uploadedFiles } from "../utils/uploaded-files";
import AnnouncementService from "../services/announcement.service";
import { successResponse } from "../utils/response";
import { validated } from "../validation/validate";
import {
  announcementAttachmentsParams,
  announcementQuery,
  createAnnouncementBody,
} from "../validation/announcement.schema";

export default class AnnouncementController {
  private readonly announcementService: AnnouncementService;

  constructor() {
    this.announcementService = new AnnouncementService();
  }

  async createAnnouncement(req: Request, res: Response, next: NextFunction) {
    try {
      const body = validated(req, createAnnouncementBody);
      const files = uploadedFiles(req);

      const announcement = await this.announcementService.createAnnouncement({
        ...body,
        files,
      });

      successResponse(
        res,
        announcement,
        "Created announcement with attachments"
      );
    } catch (err) {
      next(err);
    }
  }

  //----------------------------------------

  async getAnnouncements(req: Request, res: Response, next: NextFunction) {
    try {
      const { section_id } = validated(req, announcementQuery);

      const attachments =
        await this.announcementService.getAnnouncements(section_id);

      successResponse(res, attachments, "get announcements successfully");
    } catch (err) {
      next(err);
    }
  }

  async getAllAttachments(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = validated(req, announcementAttachmentsParams);

      const attachments =
        await this.announcementService.getAllAttachments(id);

      successResponse(res, attachments, "get attachments successfully");
    } catch (err) {
      next(err);
    }
  }
}
