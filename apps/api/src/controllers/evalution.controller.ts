import { NextFunction, Request, Response } from "express";
import EvaluationService from "../services/evaluation-service.service";
import { sessionUserId } from "../middlewares/auth.middleware";
import { successResponse } from "../utils/response";
import { validated } from "../validation/validate";
import { evaluationListQuery } from "../validation/evaluation.schema";

export default class EvaluationController {
  private readonly evaluationService: EvaluationService;

  constructor() {
    this.evaluationService = new EvaluationService();
  }

  async getStudentEvaluationList(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const student_id = sessionUserId(req);
      const { section_id } = validated(req, evaluationListQuery);
      const evaluation = await this.evaluationService.getStudentEvaluationList(
        student_id,
        section_id,
      );

      successResponse(
        res,
        evaluation,
        "Fetched student evaluation list successfully",
      );
    } catch (err) {
      next(err);
    }
  }
}
