import { NextFunction, Request, Response } from "express";
import { sessionUserId } from "../middlewares/auth.middleware";
import { uploadedFiles } from "../utils/uploaded-files";
import { successResponse } from "../utils/response";
import { HttpError } from "../utils/http-error";
import { orNotFound } from "../utils/record-not-found";
import PortfolioInternshipService from "../services/portfolio-internship.service";
import {
  createPortfolioInternshipBody,
  updatePortfolioInternshipBody,
} from "../validation/portfolio-sections.schema";
import {
  portfolioEntryParams,
  portfolioOwnerQuery,
} from "../validation/portfolio.schema";
import { validated } from "../validation/validate";

const NOT_FOUND = () => new HttpError(404, "ไม่พบการฝึกงานที่ต้องการ");

export default class PortfolioInternshipController {
  private readonly portfolioInternshipService: PortfolioInternshipService;

  constructor() {
    this.portfolioInternshipService = new PortfolioInternshipService();
  }

  async getAllPortfolioInternship(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { user_id } = validated(req, portfolioOwnerQuery);

      const result =
        await this.portfolioInternshipService.getAllPortfolioInternship(
          user_id,
        );

      successResponse(res, result, "Fetched portfolio internship successfully");
    } catch (err) {
      next(err);
    }
  }

  async getPortfolioInternshipById(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = validated(req, portfolioEntryParams);

      const result =
        await this.portfolioInternshipService.getPortfolioInternshipById(id);

      if (!result) {
        throw NOT_FOUND();
      }

      successResponse(res, result, "Fetched portfolio internship successfully");
    } catch (err) {
      next(err);
    }
  }

  async createPortfolioInternship(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const data = validated(req, createPortfolioInternshipBody);
      const files = uploadedFiles(req);

      const result =
        await this.portfolioInternshipService.createPortfolioInternship(
          sessionUserId(req),
          data,
          files,
        );

      successResponse(
        res,
        result,
        "Created portfolio internship successfully",
        201,
      );
    } catch (err) {
      next(err);
    }
  }

  async updatePortfolioInternship(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = validated(req, portfolioEntryParams);
      const data = validated(req, updatePortfolioInternshipBody);
      const files = uploadedFiles(req);

      const result = await orNotFound(
        this.portfolioInternshipService.updatePortfolioInternship(
          id,
          data,
          files,
        ),
        NOT_FOUND,
      );

      successResponse(res, result, "Updated portfolio internship successfully");
    } catch (err) {
      next(err);
    }
  }

  async deletePortfolioInternship(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = validated(req, portfolioEntryParams);

      await orNotFound(
        this.portfolioInternshipService.deletePortfolioInternship(id),
        NOT_FOUND,
      );

      successResponse(res, null, "Deleted portfolio internship successfully");
    } catch (err) {
      next(err);
    }
  }
}
