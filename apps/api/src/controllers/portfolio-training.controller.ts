import { NextFunction, Request, Response } from "express";
import { sessionUserId } from "../middlewares/auth.middleware";
import { uploadedFiles } from "../utils/uploaded-files";
import { successResponse } from "../utils/response";
import { HttpError } from "../utils/http-error";
import PortfolioTrainingService from "../services/portfolio-training.service";
import {
  createPortfolioTrainingBody,
  updatePortfolioTrainingBody,
} from "../validation/portfolio-sections.schema";
import {
  portfolioEntryParams,
  portfolioOwnerQuery,
} from "../validation/portfolio.schema";
import { validated } from "../validation/validate";

const NOT_FOUND = () => new HttpError(404, "ไม่พบการอบรมที่ต้องการ");

export default class PortfolioTrainingController {
  private readonly portfolioTrainingService: PortfolioTrainingService;

  constructor() {
    this.portfolioTrainingService = new PortfolioTrainingService();
  }

  async getAllPortfolioTraining(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { user_id } = validated(req, portfolioOwnerQuery);

      const result =
        await this.portfolioTrainingService.getAllPortfolioTraining(user_id);

      successResponse(res, result, "Fetched portfolio training successfully");
    } catch (err) {
      next(err);
    }
  }

  async getPortfolioTrainingById(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = validated(req, portfolioEntryParams);

      const result =
        await this.portfolioTrainingService.getPortfolioTrainingById(id);

      if (!result) {
        throw NOT_FOUND();
      }

      successResponse(res, result, "Fetched portfolio training successfully");
    } catch (err) {
      next(err);
    }
  }

  async createPortfolioTraining(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const data = validated(req, createPortfolioTrainingBody);
      const files = uploadedFiles(req);

      const result =
        await this.portfolioTrainingService.createPortfolioTraining(
          sessionUserId(req),
          data,
          files,
        );

      successResponse(res, result, "Created portfolio training successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  async updatePortfolioTraining(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = validated(req, portfolioEntryParams);
      const data = validated(req, updatePortfolioTrainingBody);
      const files = uploadedFiles(req);

      const result = await this.portfolioTrainingService.updatePortfolioTraining(
        id,
        data,
        files,
      );

      successResponse(res, result, "Updated portfolio training successfully");
    } catch (err) {
      next(err);
    }
  }

  async deletePortfolioTraining(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = validated(req, portfolioEntryParams);

      await this.portfolioTrainingService.deletePortfolioTraining(id);

      successResponse(res, null, "Deleted portfolio training successfully");
    } catch (err) {
      next(err);
    }
  }
}
