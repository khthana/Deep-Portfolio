import { NextFunction, Request, Response } from "express";
import { uploadedFiles } from "../utils/uploaded-files";
import { successResponse } from "../utils/response";
import ActivityService from "../services/activity.service";
import StudentActivityService from "../services/student-activity.service";
import { validated } from "../validation/validate";
import {
  activityListQuery,
  activityQuery,
  createActivityBody,
  studentActivityDetailQuery,
  updateActivityBody,
} from "../validation/activity.schema";

export default class ActivityController {
  private readonly activityService: ActivityService;
  private readonly studentActivityService: StudentActivityService;

  constructor() {
    this.activityService = new ActivityService();
    this.studentActivityService = new StudentActivityService();
  }

  async createActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const body = validated(req, createActivityBody);
      const files = uploadedFiles(req);

      const activity = await this.activityService.createActivity({
        ...body,
        files,
      });

      successResponse(res, activity, "Created activity");
    } catch (err) {
      next(err);
    }
  }

  async updateActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const body = validated(req, updateActivityBody);
      const files = uploadedFiles(req);

      const activity = await this.activityService.updateActivity({
        ...body,
        files,
      });

      successResponse(res, activity, "Updated activity");
    } catch (err) {
      next(err);
    }
  }

  async getAllActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const { section_id } = validated(req, activityListQuery);

      const activity = await this.activityService.getAllActivity(section_id);

      successResponse(res, activity, "get activity successfully");
    } catch (err) {
      next(err);
    }
  }

  async getActivityDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { activity_id } = validated(req, activityQuery);

      const activity = await this.activityService.getActivityDetail(activity_id);

      successResponse(res, activity, "get activity successfully");
    } catch (err) {
      next(err);
    }
  }

  async getStudentActivityDetail(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { student_activity_id } = validated(
        req,
        studentActivityDetailQuery,
      );

      const activity =
        await this.studentActivityService.getStudentActivityDetail(
          student_activity_id,
        );

      successResponse(res, activity, "get activity successfully");
    } catch (err) {
      next(err);
    }
  }

  async getAllSubmittedActivityList(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { activity_id } = validated(req, activityQuery);

      const activity =
        await this.studentActivityService.getAllSubmittedActivityByActivityId(
          activity_id,
        );

      successResponse(res, activity, "get activity successfully");
    } catch (err) {
      next(err);
    }
  }

  async getActivityOptions(req: Request, res: Response, next: NextFunction) {
    try {
      const { section_id } = validated(req, activityListQuery);

      const activity = await this.activityService.getActivityOptions(section_id);

      successResponse(res, activity, "get activity successfully");
    } catch (err) {
      next(err);
    }
  }

  async deleteActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const { activity_id } = validated(req, activityQuery);

      const activity = await this.activityService.deleteActivity(activity_id);

      successResponse(res, activity, "delete activity successfully");
    } catch (err) {
      next(err);
    }
  }
}
