import { NextFunction, Request, Response } from "express";
import { sessionUserId } from "../middlewares/auth.middleware";
import { uploadedFiles } from "../utils/uploaded-files";
import { successResponse } from "../utils/response";
import { HttpError } from "../utils/http-error";
import { orNotFound } from "../utils/record-not-found";
import PortfolioThesisService from "../services/portfolio-thesis.service";
import {
  createPortfolioThesisBody,
  updatePortfolioThesisBody,
} from "../validation/portfolio-sections.schema";
import {
  portfolioEntryParams,
  portfolioOwnerQuery,
} from "../validation/portfolio.schema";
import { validated } from "../validation/validate";

const NOT_FOUND = () => new HttpError(404, "ไม่พบโครงงานที่ต้องการ");

export default class PortfolioThesisController {
  private readonly portfolioThesisService: PortfolioThesisService;

  constructor() {
    this.portfolioThesisService = new PortfolioThesisService();
  }

  async getAllPortfolioThesis(req: Request, res: Response, next: NextFunction) {
    try {
      const { user_id } = validated(req, portfolioOwnerQuery);

      const result =
        await this.portfolioThesisService.getAllPortfolioThesis(user_id);

      successResponse(res, result, "Fetched portfolio thesis successfully");
    } catch (err) {
      next(err);
    }
  }

  async getPortfolioThesisById(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = validated(req, portfolioEntryParams);

      const result =
        await this.portfolioThesisService.getPortfolioThesisById(id);

      if (!result) {
        throw NOT_FOUND();
      }

      successResponse(res, result, "Fetched portfolio thesis successfully");
    } catch (err) {
      next(err);
    }
  }

  async createPortfolioThesis(req: Request, res: Response, next: NextFunction) {
    try {
      const data = validated(req, createPortfolioThesisBody);
      const files = uploadedFiles(req);

      const result = await this.portfolioThesisService.createPortfolioThesis(
        sessionUserId(req),
        data,
        files,
      );

      successResponse(res, result, "Created portfolio thesis successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  async updatePortfolioThesis(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = validated(req, portfolioEntryParams);
      const data = validated(req, updatePortfolioThesisBody);
      const files = uploadedFiles(req);

      const result = await orNotFound(
        this.portfolioThesisService.updatePortfolioThesis(id, data, files),
        NOT_FOUND,
      );

      successResponse(res, result, "Updated portfolio thesis successfully");
    } catch (err) {
      next(err);
    }
  }

  async deletePortfolioThesis(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = validated(req, portfolioEntryParams);

      await orNotFound(
        this.portfolioThesisService.deletePortfolioThesis(id),
        NOT_FOUND,
      );

      successResponse(res, null, "Deleted portfolio thesis successfully");
    } catch (err) {
      next(err);
    }
  }
}
