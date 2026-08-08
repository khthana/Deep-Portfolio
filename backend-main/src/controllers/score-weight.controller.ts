import express, { NextFunction, Request, Response } from "express";
import ScoreWeightService from "../services/score-weight.service";

export default class ScoreWeightController {
  private readonly scoreWeightService: ScoreWeightService;

  constructor() {
    this.scoreWeightService = new ScoreWeightService();
  }

  async addScoreWeight(req: Request, res: Response, next: NextFunction) {
    try {
      const scoreWeight = await this.scoreWeightService.addScoreWeight(
        req.body
      );

      res.status(200).json({
        success: true,
        message: "add score weight successfully",
        data: scoreWeight,
      });
    } catch (err) {
      next(err);
    }
  }

  async getScoreWeight(req: Request, res: Response, next: NextFunction) {
    try {
      const section_id = req.query?.section_id as string;

      const scoreWeight = await this.scoreWeightService.getScoreWeight(
        parseInt(section_id)
      );

      res.status(200).json({
        success: true,
        message: "get score weight successfully",
        data: scoreWeight,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateScoreWeight(req: Request, res: Response, next: NextFunction) {
    try {
      const scoreWeight = await this.scoreWeightService.updateScoreWeight(
        req.body
      );

      res.status(200).json({
        success: true,
        message: "update score weight successfully",
        data: scoreWeight,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteScoreWeight(req: Request, res: Response, next: NextFunction) {
    try {
      const scoreId = req.query?.scoreId as string;

      const scoreWeight = await this.scoreWeightService.deleteScoreWeight(
        parseInt(scoreId)
      );

      res.status(200).json({
        success: true,
        message: "update score weight successfully",
        data: scoreWeight,
      });
    } catch (err) {
      next(err);
    }
  }

  //--------------------------------------------------------------------------------

  async getScoreWeightOptions(req: Request, res: Response, next: NextFunction) {
    try {
      const section_id = req.query?.section_id as string;

      const scoreWeight = await this.scoreWeightService.getScoreWeightOptions(
        parseInt(section_id)
      );

      res.status(200).json({
        success: true,
        message: "get score weight options successfully",
        data: scoreWeight,
      });
    } catch (err) {
      next(err);
    }
  }
}
