import { NextFunction, Request, Response } from "express";
import { uploadedFileFields } from "../utils/uploaded-files";
import CourseMaterialService from "../services/course-material.service";
import { successResponse } from "../utils/response";
import { validated } from "../validation/validate";
import {
  courseMaterialQuery,
  createCourseMaterialBody,
  deleteCourseMaterialQuery,
} from "../validation/course-material.schema";

export default class CourseMaterialController {
  private readonly courseMaterialService: CourseMaterialService;

  constructor() {
    this.courseMaterialService = new CourseMaterialService();
  }

  async getCourseMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const { section_id } = validated(req, courseMaterialQuery);

      const courses =
        await this.courseMaterialService.getCourseMaterial(section_id);

      successResponse(res, courses, "Fetched course material successfully");
    } catch (err) {
      next(err);
    }
  }

  async createCourseMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const body = validated(req, createCourseMaterialBody);
      const files = uploadedFileFields(req);

      const courses = await this.courseMaterialService.createCourseMaterial({
        course_syllabus_id: body.course_syllabus_id,
        section_id: body.section_id,
        lecture: {
          urls: body.lecture_urls,
          files: files["lecture_files"] ?? [],
        },
        record: {
          urls: body.record_urls,
          files: files["record_files"] ?? [],
        },
      });

      successResponse(res, courses, "Created course material successfully");
    } catch (err) {
      next(err);
    }
  }

  async deleteCourseMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const { attachment_id } = validated(req, deleteCourseMaterialQuery);

      const courses =
        await this.courseMaterialService.deleteCourseMaterial(attachment_id);

      successResponse(res, courses, "Deleted course material successfully");
    } catch (err) {
      next(err);
    }
  }
}
