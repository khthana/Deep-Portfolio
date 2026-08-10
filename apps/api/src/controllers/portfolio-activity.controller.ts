import { NextFunction, Request, Response } from "express";
import { sessionUserId } from "../middlewares/auth.middleware";
import { uploadedFiles } from "../utils/uploaded-files";
import { successResponse } from "../utils/response";
import { HttpError } from "../utils/http-error";
import PortfolioActivityService from "../services/portfolio-activity.service";
import {
  createPortfolioActivityBody,
  updatePortfolioActivityBody,
} from "../validation/portfolio-sections.schema";
import {
  portfolioEntryParams,
  portfolioOwnerQuery,
} from "../validation/portfolio.schema";
import { validated } from "../validation/validate";

const NOT_FOUND = () => new HttpError(404, "ไม่พบกิจกรรมที่ต้องการ");

export default class PortfolioActivityController {
  private readonly portfolioActivityService: PortfolioActivityService;

  constructor() {
    this.portfolioActivityService = new PortfolioActivityService();
  }

  async getAllPortfolioActivity(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { user_id } = validated(req, portfolioOwnerQuery);

      const result =
        await this.portfolioActivityService.getAllPortfolioActivity(user_id);

      successResponse(res, result, "Fetched portfolio activity successfully");
    } catch (err) {
      next(err);
    }
  }

  async getPortfolioActivityById(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = validated(req, portfolioEntryParams);

      const result =
        await this.portfolioActivityService.getPortfolioActivityById(id);

      if (!result) {
        throw NOT_FOUND();
      }

      successResponse(res, result, "Fetched portfolio activity successfully");
    } catch (err) {
      next(err);
    }
  }

  async createPortfolioActivity(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const data = validated(req, createPortfolioActivityBody);
      const files = uploadedFiles(req);

      const result =
        await this.portfolioActivityService.createPortfolioActivity(
          sessionUserId(req),
          data,
          files,
        );

      successResponse(res, result, "Created portfolio activity successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  async updatePortfolioActivity(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = validated(req, portfolioEntryParams);
      const data = validated(req, updatePortfolioActivityBody);
      const files = uploadedFiles(req);

      const result = await this.portfolioActivityService.updatePortfolioActivity(
        id,
        data,
        files,
      );

      successResponse(res, result, "Updated portfolio activity successfully");
    } catch (err) {
      next(err);
    }
  }

  async deletePortfolioActivity(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = validated(req, portfolioEntryParams);

      await this.portfolioActivityService.deletePortfolioActivity(id);

      successResponse(res, null, "Deleted portfolio activity successfully");
    } catch (err) {
      next(err);
    }
  }
}
