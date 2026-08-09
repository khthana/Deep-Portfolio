import { NextFunction, Request, Response } from "express";
import StudentActivityService from "../services/student-activity.service";
import { ClassworkType } from "../models/student.model";
import { successResponse } from "../utils/response";
import { validated } from "../validation/validate";
import {
  bookmarkStudentActivityBody,
  gradeStudentActivityBody,
  studentActivityAttachmentsQuery,
} from "../validation/student-activity.schema";

export default class StudentActivityController {
  private readonly studentActivityService: StudentActivityService;

  constructor() {
    this.studentActivityService = new StudentActivityService();
  }

  async gradeStudentActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const body = validated(req, gradeStudentActivityBody);

      const courses =
        body.activity_type === ClassworkType.INDIVIDUAL
          ? await this.studentActivityService.gradeStudentActivity(body)
          : await this.studentActivityService.gradeStudentGroupActivity(body);

      successResponse(res, courses, "Grade student successfully");
    } catch (err) {
      next(err);
    }
  }

  async addStudentActivityToBookmark(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const body = validated(req, bookmarkStudentActivityBody);

      const bookmark =
        body.activity_type === ClassworkType.INDIVIDUAL
          ? await this.studentActivityService.addStudentActivityToBookmark(body)
          : await this.studentActivityService.addStudentActivityGroupToBookmark(
              body,
            );

      successResponse(res, bookmark, "bookmark successfully");
    } catch (err) {
      next(err);
    }
  }

  async getStudentActivityAttachments(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { student_activity_id } = validated(
        req,
        studentActivityAttachmentsQuery,
      );

      const attachments =
        await this.studentActivityService.getStudentActivityAttachments(
          student_activity_id,
        );

      successResponse(res, attachments, "get attachments successfully");
    } catch (err) {
      next(err);
    }
  }
}
