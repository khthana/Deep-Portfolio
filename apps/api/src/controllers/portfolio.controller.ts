import { NextFunction, Request, Response } from "express";
import { successResponse } from "../utils/response";
import PortfolioService from "../services/portfolio.service";

export default class PortfolioController {
  private readonly portfolioService: PortfolioService;

  constructor() {
    this.portfolioService = new PortfolioService();
  }

  async getAllPortfolios(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.query.user_id as string;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "user_id is required",
        });
      }
      const result = await this.portfolioService.getAllPortfolios(userId);
      successResponse(res, result, "Fetched portfolios successfully");
    } catch (err) {
      next(err);
    }
  }

  async getPortfolioById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "ID is required",
        });
      }

      const result = await this.portfolioService.getPortfolioById(id);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Portfolio not found",
        });
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
      const token = req.params.token;
      if (!token) {
        return res.status(400).json({
          success: false,
          message: "Token is required",
        });
      }

      const result = await this.portfolioService.getPublicPortfolioById(token);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Portfolio not found",
        });
      }

      successResponse(res, result, "Fetched public portfolio successfully");
    } catch (err: any) {
      if (err.status === 410) {
        return res.status(410).json({
          success: false,
          message: "This link has expired",
        });
      }
      next(err);
    }
  }

  async generateShareLink(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const { expiresAt } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "ID is required",
        });
      }

      const result = await this.portfolioService.generateShareLink(
        id,
        expiresAt || null,
      );

      successResponse(res, result, "Generated share link successfully");
    } catch (err) {
      next(err);
    }
  }

  async createPortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const { user_id, ...data } = req.body;
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: "user_id is required",
        });
      }

      const result = await this.portfolioService.createPortfolio({
        user_id,
        ...data,
      });

      successResponse(res, result, "Created portfolio successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  async updatePortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "ID is required",
        });
      }

      const result = await this.portfolioService.updatePortfolio(id, req.body);
      successResponse(res, result, "Updated portfolio successfully");
    } catch (err) {
      next(err);
    }
  }

  async deletePortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "ID is required",
        });
      }

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
