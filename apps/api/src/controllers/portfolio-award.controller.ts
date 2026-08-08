import { NextFunction, Request, Response } from "express";
import { successResponse } from "../utils/response";
import PortfolioAwardService from "../services/portfolio-award.service";

export default class PortfolioAwardController {
  private readonly portfolioAwardService: PortfolioAwardService;

  constructor() {
    this.portfolioAwardService = new PortfolioAwardService();
  }

  async getAllPortfolioAward(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.query.user_id as string;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "user_id is required",
        });
      }

      const result =
        await this.portfolioAwardService.getAllPortfolioAward(userId);

      successResponse(res, result, "Fetched portfolio award successfully");
    } catch (err) {
      next(err);
    }
  }

  async getPortfolioAwardById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID",
        });
      }

      const result = await this.portfolioAwardService.getPortfolioAwardById(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Portfolio award not found",
        });
      }

      successResponse(res, result, "Fetched portfolio award successfully");
    } catch (err) {
      next(err);
    }
  }

  async createPortfolioAward(req: Request, res: Response, next: NextFunction) {
    try {
      const { user_id, ...data } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: "user_id is required",
        });
      }

      const result = await this.portfolioAwardService.createPortfolioAward(
        user_id,
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
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID",
        });
      }

      const data = req.body;
      const files = req.files as Express.Multer.File[];

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
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID",
        });
      }

      await this.portfolioAwardService.deletePortfolioAward(id);

      successResponse(res, null, "Deleted portfolio award successfully");
    } catch (err) {
      next(err);
    }
  }
}
