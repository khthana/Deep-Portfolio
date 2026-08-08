import express, { NextFunction, Request, Response } from "express";
import LessonPlanService from "../services/lesson-plan.service";

export default class LessonPlanController {
  private readonly lessonPlanService: LessonPlanService;

  constructor() {
    this.lessonPlanService = new LessonPlanService();
  }

  async addLessonPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const lessonPlan = await this.lessonPlanService.addLessonPlan(req.body);

      res.status(200).json({
        success: true,
        message: "add lesson plan successfully",
        data: lessonPlan,
      });
    } catch (err) {
      next(err);
    }
  }

  async getLessonPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const section_id = req.query?.section_id as string;

      const lessonPlan = await this.lessonPlanService.getLessonPlan(
        parseInt(section_id),
      );

      res.status(200).json({
        success: true,
        message: "get lesson plan successfully",
        data: lessonPlan,
      });
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
      const section_id = req.query?.section_id as string;

      const lessonPlan =
        await this.lessonPlanService.getStudentLessonPlanWithMaterial(
          parseInt(section_id),
        );

      res.status(200).json({
        success: true,
        message: "get lesson plan successfully",
        data: lessonPlan,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateLessonPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const lessonPlan = await this.lessonPlanService.updateLessonPlan(
        req.body,
      );

      res.status(200).json({
        success: true,
        message: "update lesson plan successfully",
        data: lessonPlan,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteLessonPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const lesson_plan_id = req.query?.lesson_plan_id as string;

      const lessonPlan = await this.lessonPlanService.deleteLessonPlan(
        parseInt(lesson_plan_id),
      );

      res.status(200).json({
        success: true,
        message: "delete lesson plan successfully",
        data: lessonPlan,
      });
    } catch (err) {
      next(err);
    }
  }

  //-------------------------------------------------------------------

  async getLessonPlanOptions(req: Request, res: Response, next: NextFunction) {
    try {
      const section_id = req.query?.section_id as string;

      const lessonPlan = await this.lessonPlanService.getLessonPlanOptions(
        parseInt(section_id),
      );

      res.status(200).json({
        success: true,
        message: "get lesson plan options successfully",
        data: lessonPlan,
      });
    } catch (err) {
      next(err);
    }
  }
}
