import express, { NextFunction, Request, Response } from "express";
import { successResponse } from "../utils/response";
import ActivityService from "../services/activity.service";
import { UploadURLDetail } from "../models/attachments.model";
import {
  CreateActivityReqBody,
  UpdateActivityReqBody,
} from "../models/activity.model";
import { parseBool } from "../utils/parse-bool";
import StudentActivityService from "../services/student-activity.service";

export default class ActivityController {
  private readonly activityService: ActivityService;
  private readonly studentActivityService: StudentActivityService;

  constructor() {
    this.activityService = new ActivityService();
    this.studentActivityService = new StudentActivityService();
  }

  async createActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const urlList: UploadURLDetail[] = req.body.urls
        ? JSON.parse(req.body.urls)
        : [];

      const files = req.files as Express.Multer.File[];

      const data: CreateActivityReqBody = {
        announcement_date: req.body.announcement_date,
        deadline_date: req.body.deadline_date,
        course_syllabus_id: parseInt(req.body.course_syllabus_id),
        activity_name: req.body.activity_name,
        score_number: parseInt(req.body.score_number),
        activity_type: req.body.activity_type.toLowerCase(),
        detail: req.body.detail ? JSON.parse(req.body.detail) : undefined,
        is_average_score: parseBool(req.body.is_average_score),
        is_self_assessment: parseBool(req.body.is_self_assessment),
        section_id: parseInt(req.body.section_id),
        expected_level: parseInt(req.body.expected_level),
        score_ratio_id: parseInt(req.body.score_ratio_id),

        rubric: JSON.parse(req.body.rubric),

        urls: urlList,
        files: files,
      };

      const activity = await this.activityService.createActivity(data);

      successResponse(res, activity, "Created activity");
    } catch (err) {
      next(err);
    }
  }

  async updateActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const urlList: UploadURLDetail[] = req.body.urls
        ? JSON.parse(req.body.urls)
        : [];

      const files = req.files as Express.Multer.File[];

      const data: UpdateActivityReqBody = {
        activity_id: parseInt(req.body.activity_id),
        remove_attachment_ids: req.body.remove_attachment_ids
          ? JSON.parse(req.body.remove_attachment_ids)
          : [],

        announcement_date: req.body.announcement_date,
        deadline_date: req.body.deadline_date,
        course_syllabus_id: parseInt(req.body.course_syllabus_id),
        activity_name: req.body.activity_name,
        score_number: parseInt(req.body.score_number),
        activity_type: req.body.activity_type.toLowerCase(),
        detail: req.body.detail ? JSON.parse(req.body.detail) : undefined,
        is_average_score: parseBool(req.body.is_average_score),
        is_self_assessment: parseBool(req.body.is_self_assessment),
        section_id: parseInt(req.body.section_id),
        expected_level: parseInt(req.body.expected_level),
        score_ratio_id: parseInt(req.body.score_ratio_id),

        rubric: JSON.parse(req.body.rubric),

        urls: urlList,
        files: files,
      };

      const activity = await this.activityService.updateActivity(data);

      successResponse(res, activity, "Updated activity");
    } catch (err) {
      next(err);
    }
  }

  async getAllActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const section_id = req.query?.section_id as string;

      const activity = await this.activityService.getAllActivity(
        parseInt(section_id),
      );

      successResponse(res, activity, "get activity successfully");
    } catch (err) {
      next(err);
    }
  }

  async getActivityDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const activity_id = req.query?.activity_id as string;

      const activity = await this.activityService.getActivityDetail(
        parseInt(activity_id),
      );

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
      const student_activity_id = req.query?.student_activity_id as string;

      const activity =
        await this.studentActivityService.getStudentActivityDetail(
          parseInt(student_activity_id),
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
      const activity_id = req.query?.activity_id as string;

      const activity =
        await this.studentActivityService.getAllSubmittedActivityByActivityId(
          parseInt(activity_id),
        );

      successResponse(res, activity, "get activity successfully");
    } catch (err) {
      next(err);
    }
  }

  async getActivityOptions(req: Request, res: Response, next: NextFunction) {
    try {
      const section_id = req.query?.section_id as string;

      const activity = await this.activityService.getActivityOptions(
        parseInt(section_id),
      );

      successResponse(res, activity, "get activity successfully");
    } catch (err) {
      next(err);
    }
  }

  async deleteActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const activity_id = req.query?.activity_id as string;

      const activity = await this.activityService.deleteActivity(
        parseInt(activity_id),
      );

      successResponse(res, activity, "delete activity successfully");
    } catch (err) {
      next(err);
    }
  }
}
