import { NextFunction, Request, Response } from "express";
import { sessionUserId } from "../middlewares/auth.middleware";
import { uploadedFiles } from "../utils/uploaded-files";
import { successResponse } from "../utils/response";
import { HttpError } from "../utils/http-error";
import PortfolioAwardService from "../services/portfolio-award.service";
import {
  createPortfolioAwardBody,
  updatePortfolioAwardBody,
} from "../validation/portfolio-sections.schema";
import {
  portfolioEntryParams,
  portfolioOwnerQuery,
} from "../validation/portfolio.schema";
import { validated } from "../validation/validate";

const NOT_FOUND = () => new HttpError(404, "ไม่พบรางวัลที่ต้องการ");

export default class PortfolioAwardController {
  private readonly portfolioAwardService: PortfolioAwardService;

  constructor() {
    this.portfolioAwardService = new PortfolioAwardService();
  }

  async getAllPortfolioAward(req: Request, res: Response, next: NextFunction) {
    try {
      const { user_id } = validated(req, portfolioOwnerQuery);

      const result =
        await this.portfolioAwardService.getAllPortfolioAward(user_id);

      successResponse(res, result, "Fetched portfolio award successfully");
    } catch (err) {
      next(err);
    }
  }

  async getPortfolioAwardById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = validated(req, portfolioEntryParams);

      const result = await this.portfolioAwardService.getPortfolioAwardById(id);

      if (!result) {
        throw NOT_FOUND();
      }

      successResponse(res, result, "Fetched portfolio award successfully");
    } catch (err) {
      next(err);
    }
  }

  async createPortfolioAward(req: Request, res: Response, next: NextFunction) {
    try {
      const data = validated(req, createPortfolioAwardBody);
      const files = uploadedFiles(req);

      const result = await this.portfolioAwardService.createPortfolioAward(
        sessionUserId(req),
        data,
        files,
      );

      successResponse(res, result, "Created portfolio award successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  async updatePortfolioAward(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = validated(req, portfolioEntryParams);
      const data = validated(req, updatePortfolioAwardBody);
      const files = uploadedFiles(req);

      const result = await this.portfolioAwardService.updatePortfolioAward(
        id,
        data,
        files,
      );

      successResponse(res, result, "Updated portfolio award successfully");
    } catch (err) {
      next(err);
    }
  }

  async deletePortfolioAward(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = validated(req, portfolioEntryParams);

      await this.portfolioAwardService.deletePortfolioAward(id);

      successResponse(res, null, "Deleted portfolio award successfully");
    } catch (err) {
      next(err);
    }
  }
}
