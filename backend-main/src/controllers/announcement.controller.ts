import express, { NextFunction, Request, Response } from "express";
import UserService from "../services/user.service";
import AnnouncementService from "../services/announcement.service";
import { successResponse } from "../utils/response";
import { formatFileType } from "../utils/format-file-type";

export default class AnnouncementController {
  private readonly announcementService: AnnouncementService;

  constructor() {
    this.announcementService = new AnnouncementService();
  }

  async createAnnouncement(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, content, created_by, section_id, urls, all_section } =
        req.body;

      const urlList: { title: string; url: string; uploaded_by: string }[] =
        urls ? JSON.parse(urls) : [];

      const files = req.files as Express.Multer.File[];
      const announcement = await this.announcementService.createAnnouncement({
        title,
        content: JSON.parse(content),
        created_by,
        section_id: parseInt(section_id),
        urls: urlList,
        files: files,
        all_section: JSON.parse(all_section),
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
      const section_id = req.query?.section_id as string;

      const attachments = await this.announcementService.getAnnouncements(
        parseInt(section_id)
      );

      successResponse(res, attachments, "get announcements successfully");
    } catch (err) {
      next(err);
    }
  }

  async getAllAttachments(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const attachments = await this.announcementService.getAllAttachments(
        parseInt(id)
      );

      successResponse(res, attachments, "get attachments successfully");
    } catch (err) {
      next(err);
    }
  }
}
