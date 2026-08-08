import { NextFunction, Request, Response } from "express";
import { successResponse } from "../utils/response";
import PortfolioInternshipService from "../services/portfolio-internship.service";

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
      const userId = req.query.user_id as string;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "user_id is required",
        });
      }

      const result =
        await this.portfolioInternshipService.getAllPortfolioInternship(userId);

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
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID",
        });
      }

      const result =
        await this.portfolioInternshipService.getPortfolioInternshipById(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Portfolio internship not found",
        });
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
      const { user_id, ...data } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: "user_id is required",
        });
      }

      // Handle boolean conversion from FormData
      if (data.is_show_resp === "true") data.is_show_resp = true;
      if (data.is_show_resp === "false") data.is_show_resp = false;

      if (data.is_show_learning === "true") data.is_show_learning = true;
      if (data.is_show_learning === "false") data.is_show_learning = false;

      if (data.is_show_reflec === "true") data.is_show_reflec = true;
      if (data.is_show_reflec === "false") data.is_show_reflec = false;

      const result =
        await this.portfolioInternshipService.createPortfolioInternship(
          user_id,
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
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID",
        });
      }

      const data = req.body;
      const files = req.files as Express.Multer.File[];

      // Handle conversions
      if (data.is_show_resp === "true") data.is_show_resp = true;
      if (data.is_show_resp === "false") data.is_show_resp = false;

      if (data.is_show_learning === "true") data.is_show_learning = true;
      if (data.is_show_learning === "false") data.is_show_learning = false;

      if (data.is_show_reflec === "true") data.is_show_reflec = true;
      if (data.is_show_reflec === "false") data.is_show_reflec = false;

      const result =
        await this.portfolioInternshipService.updatePortfolioInternship(
          id,
          data,
          files,
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
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID",
        });
      }

      await this.portfolioInternshipService.deletePortfolioInternship(id);

      successResponse(res, null, "Deleted portfolio internship successfully");
    } catch (err) {
      next(err);
    }
  }
}
