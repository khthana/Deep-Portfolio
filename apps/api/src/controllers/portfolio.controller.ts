import { NextFunction, Request, Response } from "express";
import { successResponse } from "../utils/response";
import { HttpError } from "../utils/http-error";
import PortfolioService from "../services/portfolio.service";
import {
  createPortfolioBody,
  generateShareLinkBody,
  portfolioOwnerQuery,
  portfolioParams,
  shareTokenParams,
  updatePortfolioBody,
} from "../validation/portfolio.schema";
import { validated } from "../validation/validate";

const NOT_FOUND = () => new HttpError(404, "ไม่พบแฟ้มสะสมผลงานที่ต้องการ");

export default class PortfolioController {
  private readonly portfolioService: PortfolioService;

  constructor() {
    this.portfolioService = new PortfolioService();
  }

  async getAllPortfolios(req: Request, res: Response, next: NextFunction) {
    try {
      const { user_id } = validated(req, portfolioOwnerQuery);

      const result = await this.portfolioService.getAllPortfolios(user_id);
      successResponse(res, result, "Fetched portfolios successfully");
    } catch (err) {
      next(err);
    }
  }

  async getPortfolioById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = validated(req, portfolioParams);

      const result = await this.portfolioService.getPortfolioById(id);
      if (!result) {
        throw NOT_FOUND();
      }

      successResponse(res, result, "Fetched portfolio successfully");
    } catch (err) {
      next(err);
    }
  }

  async getPublicPortfolioById(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { token } = validated(req, shareTokenParams);

      // The expired link is a 410 the service raises as an HttpError, so it
      // reaches the client through the error handler like every other refusal
      // rather than being caught and re-answered here.
      const result = await this.portfolioService.getPublicPortfolioById(token);
      if (!result) {
        throw NOT_FOUND();
      }

      successResponse(res, result, "Fetched public portfolio successfully");
    } catch (err) {
      next(err);
    }
  }

  async generateShareLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = validated(req, portfolioParams);
      const { expiresAt } = validated(req, generateShareLinkBody);

      const result = await this.portfolioService.generateShareLink(
        id,
        expiresAt ?? null,
      );

      successResponse(res, result, "Generated share link successfully");
    } catch (err) {
      next(err);
    }
  }

  async createPortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const data = validated(req, createPortfolioBody);

      const result = await this.portfolioService.createPortfolio(data);

      successResponse(res, result, "Created portfolio successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  async updatePortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = validated(req, portfolioParams);
      const data = validated(req, updatePortfolioBody);

      const result = await this.portfolioService.updatePortfolio(id, data);
      successResponse(res, result, "Updated portfolio successfully");
    } catch (err) {
      next(err);
    }
  }

  async deletePortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = validated(req, portfolioParams);

      await this.portfolioService.deletePortfolio(id);
      successResponse(res, null, "Deleted portfolio successfully");
    } catch (err) {
      next(err);
    }
  }

  async getAllTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.portfolioService.getAllTemplates();
      successResponse(res, result, "Fetched templates successfully");
    } catch (err) {
      next(err);
    }
  }
}
