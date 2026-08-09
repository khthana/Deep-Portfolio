import { NextFunction, Request, Response } from "express";
import ScoreWeightService from "../services/score-weight.service";
import { successResponse } from "../utils/response";
import { validated } from "../validation/validate";
import {
  addScoreWeightBody,
  deleteScoreWeightQuery,
  scoreWeightQuery,
  updateScoreWeightBody,
} from "../validation/score-weight.schema";

export default class ScoreWeightController {
  private readonly scoreWeightService: ScoreWeightService;

  constructor() {
    this.scoreWeightService = new ScoreWeightService();
  }

  async addScoreWeight(req: Request, res: Response, next: NextFunction) {
    try {
      const scoreWeight = await this.scoreWeightService.addScoreWeight(
        validated(req, addScoreWeightBody),
      );

      successResponse(res, scoreWeight, "add score weight successfully");
    } catch (err) {
      next(err);
    }
  }

  async getScoreWeight(req: Request, res: Response, next: NextFunction) {
    try {
      const { section_id } = validated(req, scoreWeightQuery);

      const scoreWeight =
        await this.scoreWeightService.getScoreWeight(section_id);

      successResponse(res, scoreWeight, "get score weight successfully");
    } catch (err) {
      next(err);
    }
  }

  async updateScoreWeight(req: Request, res: Response, next: NextFunction) {
    try {
      const scoreWeight = await this.scoreWeightService.updateScoreWeight(
        validated(req, updateScoreWeightBody),
      );

      successResponse(res, scoreWeight, "update score weight successfully");
    } catch (err) {
      next(err);
    }
  }

  async deleteScoreWeight(req: Request, res: Response, next: NextFunction) {
    try {
      const { scoreId } = validated(req, deleteScoreWeightQuery);

      const scoreWeight =
        await this.scoreWeightService.deleteScoreWeight(scoreId);

      successResponse(res, scoreWeight, "delete score weight successfully");
    } catch (err) {
      next(err);
    }
  }

  //--------------------------------------------------------------------------------

  async getScoreWeightOptions(req: Request, res: Response, next: NextFunction) {
    try {
      const { section_id } = validated(req, scoreWeightQuery);

      const scoreWeight =
        await this.scoreWeightService.getScoreWeightOptions(section_id);

      successResponse(
        res,
        scoreWeight,
        "get score weight options successfully",
      );
    } catch (err) {
      next(err);
    }
  }
}
