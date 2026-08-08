import express, { NextFunction, Request, Response } from "express";
import UserService from "../services/user.service";
import StudentActivityService from "../services/student-activity.service";
import { ClassworkType } from "../models/student.model";

export default class StudentActivityController {
  private readonly studentActivityService: StudentActivityService;

  constructor() {
    this.studentActivityService = new StudentActivityService();
  }

  async gradeStudentActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const courses =
        req.body.activity_type === "INDIVIDUAL"
          ? await this.studentActivityService.gradeStudentActivity(req.body)
          : await this.studentActivityService.gradeStudentGroupActivity(
              req.body,
            );

      res.status(200).json({
        success: true,
        message: "Grade student successfully",
        data: courses,
      });
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
      const bookmark =
        req.body.activity_type === ClassworkType.INDIVIDUAL
          ? await this.studentActivityService.addStudentActivityToBookmark(
              req.body,
            )
          : await this.studentActivityService.addStudentActivityGroupToBookmark(
              req.body,
            );

      res.status(200).json({
        success: true,
        message: "bookmark successfully",
        data: bookmark,
      });
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
      const student_activity_id = req.query?.student_activity_id as string;

      const attachments =
        await this.studentActivityService.getStudentActivityAttachments(
          parseInt(student_activity_id),
        );

      res.status(200).json({
        success: true,
        data: attachments,
      });
    } catch (err) {
      next(err);
    }
  }
}
