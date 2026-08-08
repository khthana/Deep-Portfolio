import { NextFunction, Request, Response } from "express";
import { successResponse } from "../utils/response";
import PortfolioPersonalService from "../services/portfolio-personal.service";

export default class PortfolioPersonalController {
  private readonly portfolioPersonalService: PortfolioPersonalService;

  constructor() {
    this.portfolioPersonalService = new PortfolioPersonalService();
  }

  async getPortfolioPersonal(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.user_id;
      const portfolio =
        await this.portfolioPersonalService.getPortfolioPersonal(userId);

      // if (!portfolio) {
      //   return res.status(404).json({
      //     success: false,
      //     message: "Portfolio personal not found",
      //   });
      // }

      successResponse(
        res,
        portfolio,
        "Fetched portfolio personal successfully",
      );
    } catch (err) {
      next(err);
    }
  }

  async createPortfolioPersonal(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { user_id, ...data } = req.body;
      const file = req.file;

      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: "user_id is required",
        });
      }

      const portfolio =
        await this.portfolioPersonalService.createPortfolioPersonal(
          user_id,
          data,
          file,
        );

      successResponse(
        res,
        portfolio,
        "Created portfolio personal successfully",
        201,
      );
    } catch (err) {
      next(err);
    }
  }

  async updatePortfolioPersonal(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.params.user_id;
      const data = req.body;
      const file = req.file;

      const portfolio =
        await this.portfolioPersonalService.updatePortfolioPersonal(
          userId,
          data,
          file,
        );

      successResponse(
        res,
        portfolio,
        "Updated portfolio personal successfully",
      );
    } catch (err) {
      next(err);
    }
  }

  async deletePortfolioPersonal(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.params.user_id;
      await this.portfolioPersonalService.deletePortfolioPersonal(userId);

      successResponse(res, null, "Deleted portfolio personal successfully");
    } catch (err) {
      next(err);
    }
  }

  async upsertPortfolioPersonal(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.params.user_id;
      const data = req.body;
      const file = req.file;

      const portfolio =
        await this.portfolioPersonalService.upsertPortfolioPersonal(
          userId,
          data,
          file,
        );

      successResponse(
        res,
        portfolio,
        "Upserted portfolio personal successfully",
      );
    } catch (err) {
      next(err);
    }
  }
}
