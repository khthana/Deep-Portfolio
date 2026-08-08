import { NextFunction, Request, Response } from "express";
import { successResponse } from "../utils/response";
import PortfolioThesisService from "../services/portfolio-thesis.service";

export default class PortfolioThesisController {
  private readonly portfolioThesisService: PortfolioThesisService;

  constructor() {
    this.portfolioThesisService = new PortfolioThesisService();
  }

  async getAllPortfolioThesis(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.query.user_id as string;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "user_id is required",
        });
      }

      const result =
        await this.portfolioThesisService.getAllPortfolioThesis(userId);

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
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID",
        });
      }

      const result =
        await this.portfolioThesisService.getPortfolioThesisById(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Portfolio thesis not found",
        });
      }

      successResponse(res, result, "Fetched portfolio thesis successfully");
    } catch (err) {
      next(err);
    }
  }

  async createPortfolioThesis(req: Request, res: Response, next: NextFunction) {
    try {
      const { user_id, ...data } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: "user_id is required",
        });
      }

      // Handle boolean conversion from FormData if necessary (FormData sends "true"/"false" strings)
      if (data.is_show_repo === "true") data.is_show_repo = true;
      if (data.is_show_repo === "false") data.is_show_repo = false;
      if (data.is_show_role === "true") data.is_show_role = true;
      if (data.is_show_role === "false") data.is_show_role = false;
      if (data.is_show_init === "true") data.is_show_init = true;
      if (data.is_show_init === "false") data.is_show_init = false;
      if (data.is_show_reflec === "true") data.is_show_reflec = true;
      if (data.is_show_reflec === "false") data.is_show_reflec = false;

      const result = await this.portfolioThesisService.createPortfolioThesis(
        user_id,
        data,
        files,
      );

      successResponse(
        res,
        result,
        "Created portfolio thesis successfully",
        201,
      );
    } catch (err) {
      next(err);
    }
  }

  async updatePortfolioThesis(req: Request, res: Response, next: NextFunction) {
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
      if (data.is_show_repo === "true") data.is_show_repo = true;
      if (data.is_show_repo === "false") data.is_show_repo = false;
      if (data.is_show_role === "true") data.is_show_role = true;
      if (data.is_show_role === "false") data.is_show_role = false;
      if (data.is_show_init === "true") data.is_show_init = true;
      if (data.is_show_init === "false") data.is_show_init = false;
      if (data.is_show_reflec === "true") data.is_show_reflec = true;
      if (data.is_show_reflec === "false") data.is_show_reflec = false;

      const result = await this.portfolioThesisService.updatePortfolioThesis(
        id,
        data,
        files,
      );

      successResponse(res, result, "Updated portfolio thesis successfully");
    } catch (err) {
      next(err);
    }
  }

  async deletePortfolioThesis(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID",
        });
      }

      await this.portfolioThesisService.deletePortfolioThesis(id);

      successResponse(res, null, "Deleted portfolio thesis successfully");
    } catch (err) {
      next(err);
    }
  }
}
