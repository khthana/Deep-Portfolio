import { NextFunction, Request, Response } from "express";
import { sessionUserId } from "../middlewares/auth.middleware";
import { successResponse } from "../utils/response";
import { HttpError } from "../utils/http-error";
import { orNotFound } from "../utils/record-not-found";
import PortfolioPersonalService from "../services/portfolio-personal.service";
import {
  portfolioPersonalBody,
  portfolioPersonalParams,
} from "../validation/portfolio-personal.schema";
import { validated } from "../validation/validate";

const NOT_FOUND = () => new HttpError(404, "ไม่พบข้อมูลส่วนตัวของผู้ใช้รายนี้");

export default class PortfolioPersonalController {
  private readonly portfolioPersonalService: PortfolioPersonalService;

  constructor() {
    this.portfolioPersonalService = new PortfolioPersonalService();
  }

  async getPortfolioPersonal(req: Request, res: Response, next: NextFunction) {
    try {
      const { user_id } = validated(req, portfolioPersonalParams);

      const portfolio =
        await this.portfolioPersonalService.getPortfolioPersonal(user_id);

      // The service answers null for an unknown user and only for that — a
      // user who exists but has entered no details gets the defaults from
      // their account instead. So this is "no such user", not "nothing filled
      // in yet".
      if (!portfolio) {
        throw NOT_FOUND();
      }

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
      const data = validated(req, portfolioPersonalBody);
      const file = req.file;

      const portfolio =
        await this.portfolioPersonalService.createPortfolioPersonal(
          sessionUserId(req),
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
      const { user_id } = validated(req, portfolioPersonalParams);
      const data = validated(req, portfolioPersonalBody);
      const file = req.file;

      const portfolio = await orNotFound(
        this.portfolioPersonalService.updatePortfolioPersonal(
          user_id,
          data,
          file,
        ),
        NOT_FOUND,
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
      const { user_id } = validated(req, portfolioPersonalParams);

      await orNotFound(
        this.portfolioPersonalService.deletePortfolioPersonal(user_id),
        NOT_FOUND,
      );

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
      const { user_id } = validated(req, portfolioPersonalParams);
      const data = validated(req, portfolioPersonalBody);
      const file = req.file;

      const portfolio =
        await this.portfolioPersonalService.upsertPortfolioPersonal(
          user_id,
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
