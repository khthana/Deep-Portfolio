import express, { NextFunction, Request, Response } from "express";
import UserService from "../services/user.service";
import StudentActivityService from "../services/student-activity.service";
import StudentLearningActivityService from "../services/student-learning-activity.service";
import { ClassworkType } from "../models/student.model";

export default class StudentLearningActivityController {
  private readonly studentLearningActivityService: StudentLearningActivityService;

  constructor() {
    this.studentLearningActivityService = new StudentLearningActivityService();
  }

  async gradeStudentActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const courses =
        req.body.activity_type === ClassworkType.INDIVIDUAL
          ? await this.studentLearningActivityService.gradeStudentLearningActivity(
              req.body,
            )
          : await this.studentLearningActivityService.gradeStudentGroupLearningActivity(
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

  async addStudentLearningActivityToBookmark(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const bookmark =
        req.body.activity_type === ClassworkType.INDIVIDUAL
          ? await this.studentLearningActivityService.addStudentLearningActivityToBookmark(
              req.body,
            )
          : await this.studentLearningActivityService.addStudentLearningActivityGroupToBookmark(
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
}
