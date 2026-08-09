import { NextFunction, Request, Response } from "express";
import ActivityCLOMappingService from "../services/activity-clo-mapping.service";
import { successResponse } from "../utils/response";
import { validated } from "../validation/validate";
import {
  cloMappingQuery,
  createActivityCLOMappingBody,
  validateActivityCLOMappingQuery,
} from "../validation/clo-mapping.schema";

export default class ActivityCLOMappingController {
  private readonly activityCLOMappingService: ActivityCLOMappingService;

  constructor() {
    this.activityCLOMappingService = new ActivityCLOMappingService();
  }

  async createActivityCLOMapping(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const body = validated(req, createActivityCLOMappingBody);

      const activityCLOMapping =
        await this.activityCLOMappingService.createActivityCLOMapping(body);

      successResponse(
        res,
        activityCLOMapping,
        "Create activity clo mapping successfully",
      );
    } catch (err) {
      next(err);
    }
  }

  async getActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const { clo_id } = validated(req, cloMappingQuery);

      const activity = await this.activityCLOMappingService.getActivity(clo_id);

      successResponse(res, activity, "get activity successfully");
    } catch (err) {
      next(err);
    }
  }

  async validateActivityCLOMapping(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { activity_id } = validated(req, validateActivityCLOMappingQuery);

      const activity =
        await this.activityCLOMappingService.validateActivityCLOMapping(
          activity_id,
        );

      successResponse(res, activity, "validate activity successfully");
    } catch (err) {
      next(err);
    }
  }
}
