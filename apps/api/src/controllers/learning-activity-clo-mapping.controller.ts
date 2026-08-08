import express, { NextFunction, Request, Response } from "express";
import { successResponse } from "../utils/response";
import LearningActivityCLOMappingService from "../services/learning-activity-clo-mapping.service";

export default class LearningActivityCLOMappingController {
  private readonly learningActivityCLOMappingService: LearningActivityCLOMappingService;

  constructor() {
    this.learningActivityCLOMappingService =
      new LearningActivityCLOMappingService();
  }

  async createLearningActivityCLOMapping(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const learningActivityCLOMapping =
        await this.learningActivityCLOMappingService.createLearningActivityCLOMapping(
          req.body
        );

      successResponse(
        res,
        learningActivityCLOMapping,
        "Create learning activity clo mapping successfully"
      );
    } catch (err) {
      next(err);
    }
  }

  async getLearningActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const clo_id = req.query?.clo_id as string;

      const learningActivity =
        await this.learningActivityCLOMappingService.getLearningActivity(
          parseInt(clo_id)
        );

      successResponse(
        res,
        learningActivity,
        "get learning activity successfully"
      );
    } catch (err) {
      next(err);
    }
  }
}
