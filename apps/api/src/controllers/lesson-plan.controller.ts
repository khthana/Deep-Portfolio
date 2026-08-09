import { NextFunction, Request, Response } from "express";
import LessonPlanService from "../services/lesson-plan.service";
import { successResponse } from "../utils/response";
import { validated } from "../validation/validate";
import {
  addLessonPlanBody,
  deleteLessonPlanQuery,
  lessonPlanQuery,
  updateLessonPlanBody,
} from "../validation/lesson-plan.schema";

export default class LessonPlanController {
  private readonly lessonPlanService: LessonPlanService;

  constructor() {
    this.lessonPlanService = new LessonPlanService();
  }

  async addLessonPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const lessonPlan = await this.lessonPlanService.addLessonPlan(
        validated(req, addLessonPlanBody),
      );

      successResponse(res, lessonPlan, "add lesson plan successfully");
    } catch (err) {
      next(err);
    }
  }

  async getLessonPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { section_id } = validated(req, lessonPlanQuery);

      const lessonPlan = await this.lessonPlanService.getLessonPlan(section_id);

      successResponse(res, lessonPlan, "get lesson plan successfully");
    } catch (err) {
      next(err);
    }
  }

  async getStudentLessonPlanWithMaterial(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { section_id } = validated(req, lessonPlanQuery);

      const lessonPlan =
        await this.lessonPlanService.getStudentLessonPlanWithMaterial(
          section_id,
        );

      successResponse(res, lessonPlan, "get lesson plan successfully");
    } catch (err) {
      next(err);
    }
  }

  async updateLessonPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const lessonPlan = await this.lessonPlanService.updateLessonPlan(
        validated(req, updateLessonPlanBody),
      );

      successResponse(res, lessonPlan, "update lesson plan successfully");
    } catch (err) {
      next(err);
    }
  }

  async deleteLessonPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { lesson_plan_id } = validated(req, deleteLessonPlanQuery);

      const lessonPlan =
        await this.lessonPlanService.deleteLessonPlan(lesson_plan_id);

      successResponse(res, lessonPlan, "delete lesson plan successfully");
    } catch (err) {
      next(err);
    }
  }

  //-------------------------------------------------------------------

  async getLessonPlanOptions(req: Request, res: Response, next: NextFunction) {
    try {
      const { section_id } = validated(req, lessonPlanQuery);

      const lessonPlan =
        await this.lessonPlanService.getLessonPlanOptions(section_id);

      successResponse(res, lessonPlan, "get lesson plan options successfully");
    } catch (err) {
      next(err);
    }
  }
}
