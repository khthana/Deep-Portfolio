import { NextFunction, Request, Response } from "express";
import StudentLearningActivityService from "../services/student-learning-activity.service";
import { ClassworkType } from "../models/student.model";
import { successResponse } from "../utils/response";
import { validated } from "../validation/validate";
import {
  bookmarkStudentLearningActivityBody,
  gradeStudentLearningActivityBody,
} from "../validation/student-learning-activity.schema";

export default class StudentLearningActivityController {
  private readonly studentLearningActivityService: StudentLearningActivityService;

  constructor() {
    this.studentLearningActivityService = new StudentLearningActivityService();
  }

  async gradeStudentActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const body = validated(req, gradeStudentLearningActivityBody);

      const courses =
        body.activity_type === ClassworkType.INDIVIDUAL
          ? await this.studentLearningActivityService.gradeStudentLearningActivity(
              body,
            )
          : await this.studentLearningActivityService.gradeStudentGroupLearningActivity(
              body,
            );

      successResponse(res, courses, "Grade student successfully");
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
      const body = validated(req, bookmarkStudentLearningActivityBody);

      const bookmark =
        body.activity_type === ClassworkType.INDIVIDUAL
          ? await this.studentLearningActivityService.addStudentLearningActivityToBookmark(
              body,
            )
          : await this.studentLearningActivityService.addStudentLearningActivityGroupToBookmark(
              body,
            );

      successResponse(res, bookmark, "bookmark successfully");
    } catch (err) {
      next(err);
    }
  }
}
