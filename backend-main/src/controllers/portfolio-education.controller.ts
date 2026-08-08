import { NextFunction, Request, Response } from "express";
import { successResponse } from "../utils/response";
import PortfolioEducationService from "../services/portfolio-education.service";

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
      const userId = req.query.user_id as string;
      const result =
        await this.portfolioEducationService.getAllPortfolioEducation(userId);

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
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID",
        });
      }

      const result =
        await this.portfolioEducationService.getPortfolioEducationById(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Portfolio education not found",
        });
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
      const { user_id, ...data } = req.body;

      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: "user_id is required",
        });
      }

      const result =
        await this.portfolioEducationService.createPortfolioEducation(
          user_id,
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
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID",
        });
      }

      const data = req.body;
      const result =
        await this.portfolioEducationService.updatePortfolioEducation(id, data);

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
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID",
        });
      }

      await this.portfolioEducationService.deletePortfolioEducation(id);

      successResponse(res, null, "Deleted portfolio education successfully");
    } catch (err) {
      next(err);
    }
  }
}
