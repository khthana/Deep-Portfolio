import { NextFunction, Request, Response } from "express";
import { sessionUserId } from "../middlewares/auth.middleware";
import { successResponse } from "../utils/response";
import { HttpError } from "../utils/http-error";
import { orNotFound } from "../utils/record-not-found";
import PortfolioEducationService from "../services/portfolio-education.service";
import {
  createPortfolioEducationBody,
  updatePortfolioEducationBody,
} from "../validation/portfolio-sections.schema";
import {
  portfolioEntryParams,
  portfolioOwnerQuery,
} from "../validation/portfolio.schema";
import { validated } from "../validation/validate";

const NOT_FOUND = () => new HttpError(404, "ไม่พบประวัติการศึกษาที่ต้องการ");

export default class PortfolioEducationController {
  private readonly portfolioEducationService: PortfolioEducationService;

  constructor() {
    this.portfolioEducationService = new PortfolioEducationService();
  }

  async getAllPortfolioEducation(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { user_id } = validated(req, portfolioOwnerQuery);

      const result =
        await this.portfolioEducationService.getAllPortfolioEducation(user_id);

      successResponse(res, result, "Fetched portfolio education successfully");
    } catch (err) {
      next(err);
    }
  }

  async getPortfolioEducationById(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = validated(req, portfolioEntryParams);

      const result =
        await this.portfolioEducationService.getPortfolioEducationById(id);

      if (!result) {
        throw NOT_FOUND();
      }

      successResponse(res, result, "Fetched portfolio education successfully");
    } catch (err) {
      next(err);
    }
  }

  async createPortfolioEducation(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const data = validated(req, createPortfolioEducationBody);

      const result =
        await this.portfolioEducationService.createPortfolioEducation(
          sessionUserId(req),
          data,
        );

      successResponse(
        res,
        result,
        "Created portfolio education successfully",
        201,
      );
    } catch (err) {
      next(err);
    }
  }

  async updatePortfolioEducation(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = validated(req, portfolioEntryParams);
      const data = validated(req, updatePortfolioEducationBody);

      const result = await orNotFound(
        this.portfolioEducationService.updatePortfolioEducation(id, data),
        NOT_FOUND,
      );

      successResponse(res, result, "Updated portfolio education successfully");
    } catch (err) {
      next(err);
    }
  }

  async deletePortfolioEducation(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = validated(req, portfolioEntryParams);

      await orNotFound(
        this.portfolioEducationService.deletePortfolioEducation(id),
        NOT_FOUND,
      );

      successResponse(res, null, "Deleted portfolio education successfully");
    } catch (err) {
      next(err);
    }
  }
}
