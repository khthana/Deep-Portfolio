import express, { NextFunction, Request, Response } from "express";
import UserService from "../services/user.service";
import CourseMaterialService from "../services/course-material.service";
import { UploadURLDetail } from "../models/attachments.model";
import { CreateCourseMaterialReqBody } from "../models/course-material.model";

export default class CourseMaterialController {
  private readonly courseMaterialService: CourseMaterialService;

  constructor() {
    this.courseMaterialService = new CourseMaterialService();
  }

  async getCourseMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const section_id = req.query?.section_id as string;
      const courses = await this.courseMaterialService.getCourseMaterial(
        parseInt(section_id),
      );

      res.status(200).json({
        success: true,
        message: "Fetched course material successfully",
        data: courses,
      });
    } catch (err) {
      next(err);
    }
  }

  async createCourseMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      const lectureFiles = files?.["lecture_files"] || [];
      const recordFiles = files?.["record_files"] || [];

      const lectureUrls: UploadURLDetail[] = req.body.lecture_urls
        ? JSON.parse(req.body.lecture_urls)
        : [];
      const recordUrls: UploadURLDetail[] = req.body.record_urls
        ? JSON.parse(req.body.record_urls)
        : [];

      const data: CreateCourseMaterialReqBody = {
        course_syllabus_id: parseInt(req.body.course_syllabus_id),
        section_id: parseInt(req.body.section_id),
        lecture: { urls: lectureUrls, files: lectureFiles },
        record: { urls: recordUrls, files: recordFiles },
      };

      const courses =
        await this.courseMaterialService.createCourseMaterial(data);

      res.status(200).json({
        success: true,
        message: "Created course material successfully",
        data: courses,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteCourseMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const attachment_id = req.query?.attachment_id as string;
      const courses = await this.courseMaterialService.deleteCourseMaterial(
        parseInt(attachment_id),
      );

      res.status(200).json({
        success: true,
        message: "Deleted course material successfully",
        data: courses,
      });
    } catch (err) {
      next(err);
    }
  }
}
