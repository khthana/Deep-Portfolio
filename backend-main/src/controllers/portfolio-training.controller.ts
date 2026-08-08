import { NextFunction, Request, Response } from "express";
import { successResponse } from "../utils/response";
import PortfolioTrainingService from "../services/portfolio-training.service";

export default class PortfolioTrainingController {
  private readonly portfolioTrainingService: PortfolioTrainingService;

  constructor() {
    this.portfolioTrainingService = new PortfolioTrainingService();
  }

  async getAllPortfolioTraining(
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
        await this.portfolioTrainingService.getAllPortfolioTraining(userId);

      successResponse(res, result, "Fetched portfolio training successfully");
    } catch (err) {
      next(err);
    }
  }

  async getPortfolioTrainingById(
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
        await this.portfolioTrainingService.getPortfolioTrainingById(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Portfolio training not found",
        });
      }

      successResponse(res, result, "Fetched portfolio training successfully");
    } catch (err) {
      next(err);
    }
  }

  async createPortfolioTraining(
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

      // Handle boolean conversion from FormData if necessary (FormData sends "true"/"false" strings)
      if (data.is_show === "true") data.is_show = true;
      if (data.is_show === "false") data.is_show = false;
      if (data.year) data.year = Number(data.year);

      const result =
        await this.portfolioTrainingService.createPortfolioTraining(
          user_id,
          data,
          files,
        );

      successResponse(
        res,
        result,
        "Created portfolio training successfully",
        201,
      );
    } catch (err) {
      next(err);
    }
  }

  async updatePortfolioTraining(
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
      if (data.is_show === "true") data.is_show = true;
      if (data.is_show === "false") data.is_show = false;
      if (data.year) data.year = Number(data.year);

      const result =
        await this.portfolioTrainingService.updatePortfolioTraining(
          id,
          data,
          files,
        );

      successResponse(res, result, "Updated portfolio training successfully");
    } catch (err) {
      next(err);
    }
  }

  async deletePortfolioTraining(
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

      await this.portfolioTrainingService.deletePortfolioTraining(id);

      successResponse(res, null, "Deleted portfolio training successfully");
    } catch (err) {
      next(err);
    }
  }
}
