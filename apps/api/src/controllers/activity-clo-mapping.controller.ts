import express, { NextFunction, Request, Response } from "express";
import ActivityCLOMappingService from "../services/activity-clo-mapping.service";
import { successResponse } from "../utils/response";

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
      const activityCLOMapping =
        await this.activityCLOMappingService.createActivityCLOMapping(req.body);

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
      const clo_id = req.query?.clo_id as string;

      const activity = await this.activityCLOMappingService.getActivity(
        parseInt(clo_id),
      );

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
      const activity_id = req.query?.activity_id as string;

      const activity =
        await this.activityCLOMappingService.validateActivityCLOMapping(
          parseInt(activity_id),
        );

      successResponse(res, activity, "validate activity successfully");
    } catch (err) {
      next(err);
    }
  }
}
