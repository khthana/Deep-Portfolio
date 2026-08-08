import { NextFunction, Request, Response } from "express";
import { successResponse } from "../utils/response";
import PortfolioActivityService from "../services/portfolio-activity.service";

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
      const userId = req.query.user_id as string;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "user_id is required",
        });
      }

      const result =
        await this.portfolioActivityService.getAllPortfolioActivity(userId);

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
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID",
        });
      }

      const result =
        await this.portfolioActivityService.getPortfolioActivityById(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Portfolio activity not found",
        });
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
      const { user_id, ...data } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: "user_id is required",
        });
      }

      // Handle FormData conversions
      if (data.is_show === "true") data.is_show = true;
      else if (data.is_show === "false") data.is_show = false;
      else if (data.is_show === "") delete data.is_show;
      if (data.date) data.date = new Date(data.date).toISOString();
      else if (data.date === "") delete data.date;

      const result =
        await this.portfolioActivityService.createPortfolioActivity(
          user_id,
          data,
          files,
        );

      successResponse(
        res,
        result,
        "Created portfolio activity successfully",
        201,
      );
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
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID",
        });
      }

      const data = req.body;
      const files = req.files as Express.Multer.File[];

      // Handle FormData conversions
      if (data.is_show === "true") data.is_show = true;
      else if (data.is_show === "false") data.is_show = false;
      else if (data.is_show === "") delete data.is_show;
      if (data.date) data.date = new Date(data.date).toISOString();
      else if (data.date === "") delete data.date;

      const result =
        await this.portfolioActivityService.updatePortfolioActivity(
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
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID",
        });
      }

      await this.portfolioActivityService.deletePortfolioActivity(id);

      successResponse(res, null, "Deleted portfolio activity successfully");
    } catch (err) {
      next(err);
    }
  }
}
