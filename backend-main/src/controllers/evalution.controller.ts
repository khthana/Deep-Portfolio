import express, { NextFunction, Request, Response } from "express";
import EvaluationService from "../services/evaluation-service.service";
import { AuthRequest } from "../middlewares/auth.middleware";

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
      const student_id = (req as AuthRequest).user?.user_id;
      const section_id = req.query.section_id as string;
      const evaluation = await this.evaluationService.getStudentEvaluationList(
        student_id,
        parseInt(section_id),
      );

      res.status(200).json({
        success: true,
        message: "Fetched student evaluation list successfully",
        data: evaluation,
      });
    } catch (err) {
      next(err);
    }
  }
}
