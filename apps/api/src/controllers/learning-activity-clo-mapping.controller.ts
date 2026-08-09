import { NextFunction, Request, Response } from "express";
import { successResponse } from "../utils/response";
import LearningActivityCLOMappingService from "../services/learning-activity-clo-mapping.service";
import { validated } from "../validation/validate";
import {
  cloMappingQuery,
  createLearningActivityCLOMappingBody,
} from "../validation/clo-mapping.schema";

export default class LearningActivityCLOMappingController {
  private readonly learningActivityCLOMappingService: LearningActivityCLOMappingService;

  constructor() {
    this.learningActivityCLOMappingService =
      new LearningActivityCLOMappingService();
  }

  async createLearningActivityCLOMapping(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const body = validated(req, createLearningActivityCLOMappingBody);

      const learningActivityCLOMapping =
        await this.learningActivityCLOMappingService.createLearningActivityCLOMapping(
          body,
        );

      successResponse(
        res,
        learningActivityCLOMapping,
        "Create learning activity clo mapping successfully",
      );
    } catch (err) {
      next(err);
    }
  }

  async getLearningActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const { clo_id } = validated(req, cloMappingQuery);

      const learningActivity =
        await this.learningActivityCLOMappingService.getLearningActivity(
          clo_id,
        );

      successResponse(
        res,
        learningActivity,
        "get learning activity successfully",
      );
    } catch (err) {
      next(err);
    }
  }
}
