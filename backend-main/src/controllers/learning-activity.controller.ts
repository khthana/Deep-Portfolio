import { NextFunction, Request, Response } from "express";
import { successResponse } from "../utils/response";
import LearningActivityService from "../services/learning-activity.service";
import { UploadURLDetail } from "../models/attachments.model";
import {
  CreateLearningActivityReqBody,
  UpdateLearningActivityReqBody,
} from "../models/learning-activity.model";
import StudentLearningActivityService from "../services/student-learning-activity.service";

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
      const urlList: UploadURLDetail[] = req.body.urls
        ? JSON.parse(req.body.urls)
        : [];

      const files = req.files as Express.Multer.File[];

      const data: CreateLearningActivityReqBody = {
        announcement_date: req.body.announcement_date,
        deadline_date: req.body.deadline_date,
        course_syllabus_id: parseInt(req.body.course_syllabus_id),
        learning_activity_name: req.body.learning_activity_name,
        learning_activity_type: req.body.learning_activity_type.toLowerCase(),
        detail: req.body.detail ? JSON.parse(req.body.detail) : undefined,
        section_id: parseInt(req.body.section_id),

        urls: urlList,
        files: files,
      };

      const activity =
        await this.learningActivityService.createLearningActivity(data);

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
      const urlList: UploadURLDetail[] = req.body.urls
        ? JSON.parse(req.body.urls)
        : [];

      const files = req.files as Express.Multer.File[];

      const data: UpdateLearningActivityReqBody = {
        learning_activity_id: parseInt(req.body.learning_activity_id),
        remove_attachment_ids: req.body.remove_attachment_ids
          ? JSON.parse(req.body.remove_attachment_ids)
          : [],

        announcement_date: req.body.announcement_date,
        deadline_date: req.body.deadline_date,
        course_syllabus_id: parseInt(req.body.course_syllabus_id),
        learning_activity_name: req.body.learning_activity_name,
        learning_activity_type: req.body.learning_activity_type.toLowerCase(),
        detail: req.body.detail ? JSON.parse(req.body.detail) : undefined,
        section_id: parseInt(req.body.section_id),

        urls: urlList,
        files: files,
      };

      const activity =
        await this.learningActivityService.updateLearningActivity(data);

      successResponse(res, activity, "Updated learning activity");
    } catch (err) {
      next(err);
    }
  }
  // async createLearningActivity(
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) {
  //   try {
  //     const activity =
  //       await this.learningActivityService.createLearningActivity(req.body);

  //     successResponse(res, activity, "Created learning activity");
  //   } catch (err) {
  //     next(err);
  //   }
  // }

  async getAllLearningActivity(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const section_id = req.query?.section_id as string;

      const activity =
        await this.learningActivityService.getAllLearningActivity(
          parseInt(section_id),
        );

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
      const learning_activity_id = req.query?.learning_activity_id as string;

      const activity =
        await this.learningActivityService.getLearningActivityDetail(
          parseInt(learning_activity_id),
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
      const student_learning_activity_id = req.query
        ?.student_learning_activity_id as string;

      const activity =
        await this.studentLearningActivityService.getStudentLearningActivityDetail(
          parseInt(student_learning_activity_id),
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
      const section_id = req.query?.section_id as string;

      const activity =
        await this.learningActivityService.getLearningActivityOptions(
          parseInt(section_id),
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
      const learning_activity_id = req.query?.learning_activity_id as string;

      const activity =
        await this.studentLearningActivityService.getAllSubmittedLearningActivityByLearningActivityId(
          parseInt(learning_activity_id),
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
      const learning_activity_id = req.query?.learning_activity_id as string;

      const activity =
        await this.learningActivityService.deleteLearningActivity(
          parseInt(learning_activity_id),
        );

      successResponse(res, activity, "delete learning activity successfully");
    } catch (err) {
      next(err);
    }
  }
}
