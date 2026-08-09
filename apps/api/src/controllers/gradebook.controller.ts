import { NextFunction, Request, Response } from "express";
import { GradebookService } from "../services/gradebook.service";
import { successResponse } from "../utils/response";
import { validated } from "../validation/validate";
import { gradebookQuery } from "../validation/gradebook.schema";

export default class GradebookController {
  private readonly gradebookService: GradebookService;

  constructor() {
    this.gradebookService = new GradebookService();
  }

  async getGradebookPerStudent(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { section_id } = validated(req, gradebookQuery);
      const gradebook =
        await this.gradebookService.getGradebookPerStudent(section_id);

      successResponse(
        res,
        gradebook,
        "Fetched gradebook per student successfully",
      );
    } catch (err) {
      next(err);
    }
  }

  async getGradebookPerActivity(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { section_id } = validated(req, gradebookQuery);
      const gradebook =
        await this.gradebookService.getGradebookPerActivity(section_id);

      successResponse(
        res,
        gradebook,
        "Fetched gradebook per activity successfully",
      );
    } catch (err) {
      next(err);
    }
  }
}
