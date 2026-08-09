import { NextFunction, Request, Response } from "express";
import { uploadedFiles } from "../utils/uploaded-files";
import { successResponse } from "../utils/response";
import LearningActivityService from "../services/learning-activity.service";
import StudentLearningActivityService from "../services/student-learning-activity.service";
import { validated } from "../validation/validate";
import {
  createLearningActivityBody,
  learningActivityListQuery,
  learningActivityQuery,
  studentLearningActivityDetailQuery,
  updateLearningActivityBody,
} from "../validation/learning-activity.schema";

export default class LearningActivityController {
  private readonly learningActivityService: LearningActivityService;
  private readonly studentLearningActivityService: StudentLearningActivityService;

  constructor() {
    this.learningActivityService = new LearningActivityService();
    this.studentLearningActivityService = new StudentLearningActivityService();
  }

  async createLearningActivity(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const body = validated(req, createLearningActivityBody);
      const files = uploadedFiles(req);

      const activity =
        await this.learningActivityService.createLearningActivity({
          ...body,
          files,
        });

      successResponse(res, activity, "Created learning activity");
    } catch (err) {
      next(err);
    }
  }

  async updateLearningActivity(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const body = validated(req, updateLearningActivityBody);
      const files = uploadedFiles(req);

      const activity =
        await this.learningActivityService.updateLearningActivity({
          ...body,
          files,
        });

      successResponse(res, activity, "Updated learning activity");
    } catch (err) {
      next(err);
    }
  }

  async getAllLearningActivity(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { section_id } = validated(req, learningActivityListQuery);

      const activity =
        await this.learningActivityService.getAllLearningActivity(section_id);

      successResponse(res, activity, "get learning activity successfully");
    } catch (err) {
      next(err);
    }
  }

  async getLearningActivityDetail(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { learning_activity_id } = validated(req, learningActivityQuery);

      const activity =
        await this.learningActivityService.getLearningActivityDetail(
          learning_activity_id,
        );

      successResponse(res, activity, "get learning activity successfully");
    } catch (err) {
      next(err);
    }
  }

  async getStudentLearningActivityDetail(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { student_learning_activity_id } = validated(
        req,
        studentLearningActivityDetailQuery,
      );

      const activity =
        await this.studentLearningActivityService.getStudentLearningActivityDetail(
          student_learning_activity_id,
        );

      successResponse(res, activity, "get learning activity successfully");
    } catch (err) {
      next(err);
    }
  }

  async getLearningActivityOptions(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { section_id } = validated(req, learningActivityListQuery);

      const activity =
        await this.learningActivityService.getLearningActivityOptions(
          section_id,
        );

      successResponse(res, activity, "get learning activity successfully");
    } catch (err) {
      next(err);
    }
  }

  async getAllSubmittedLearningActivityList(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { learning_activity_id } = validated(req, learningActivityQuery);

      const activity =
        await this.studentLearningActivityService.getAllSubmittedLearningActivityByLearningActivityId(
          learning_activity_id,
        );

      successResponse(res, activity, "get activity successfully");
    } catch (err) {
      next(err);
    }
  }

  async deleteLearningActivity(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { learning_activity_id } = validated(req, learningActivityQuery);

      const activity =
        await this.learningActivityService.deleteLearningActivity(
          learning_activity_id,
        );

      successResponse(res, activity, "delete learning activity successfully");
    } catch (err) {
      next(err);
    }
  }
}
