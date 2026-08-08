import { NextFunction, Request, Response } from "express";
import RubricService from "../services/rubric.service";

export default class RubricController {
  private readonly rubricService: RubricService;

  constructor() {
    this.rubricService = new RubricService();
  }

  async getSharedRubric(req: Request, res: Response, next: NextFunction) {
    try {
      const program_id = req.query?.program_id as string;
      const courses = await this.rubricService.getSharedRubric(program_id);

      res.status(200).json({
        success: true,
        message: "Fetched rubric successfully",
        data: courses,
      });
    } catch (err) {
      next(err);
    }
  }

  async getSharedRubricDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const rubric_id = req.query?.rubric_id as string;
      const courses = await this.rubricService.getSharedRubricDetail(
        parseInt(rubric_id)
      );

      res.status(200).json({
        success: true,
        message: "Fetched rubric successfully",
        data: courses,
      });
    } catch (err) {
      next(err);
    }
  }
}
