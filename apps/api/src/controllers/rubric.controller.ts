import { NextFunction, Request, Response } from "express";
import RubricService from "../services/rubric.service";
import { successResponse } from "../utils/response";
import { validated } from "../validation/validate";
import {
  sharedRubricDetailQuery,
  sharedRubricQuery,
} from "../validation/rubric.schema";

export default class RubricController {
  private readonly rubricService: RubricService;

  constructor() {
    this.rubricService = new RubricService();
  }

  async getSharedRubric(req: Request, res: Response, next: NextFunction) {
    try {
      const { program_id } = validated(req, sharedRubricQuery);

      const courses = await this.rubricService.getSharedRubric(program_id);

      successResponse(res, courses, "Fetched rubric successfully");
    } catch (err) {
      next(err);
    }
  }

  async getSharedRubricDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { rubric_id } = validated(req, sharedRubricDetailQuery);

      const courses = await this.rubricService.getSharedRubricDetail(rubric_id);

      successResponse(res, courses, "Fetched rubric successfully");
    } catch (err) {
      next(err);
    }
  }
}
