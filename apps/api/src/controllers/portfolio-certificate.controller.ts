import { NextFunction, Request, Response } from "express";
import { sessionUserId } from "../middlewares/auth.middleware";
import { uploadedFiles } from "../utils/uploaded-files";
import { successResponse } from "../utils/response";
import { HttpError } from "../utils/http-error";
import { orNotFound } from "../utils/record-not-found";
import PortfolioCertificateService from "../services/portfolio-certificate.service";
import {
  createPortfolioCertificateBody,
  updatePortfolioCertificateBody,
} from "../validation/portfolio-sections.schema";
import {
  portfolioEntryParams,
  portfolioOwnerQuery,
} from "../validation/portfolio.schema";
import { validated } from "../validation/validate";

const NOT_FOUND = () => new HttpError(404, "ไม่พบเกียรติบัตรที่ต้องการ");

export default class PortfolioCertificateController {
  private readonly portfolioCertificateService: PortfolioCertificateService;

  constructor() {
    this.portfolioCertificateService = new PortfolioCertificateService();
  }

  async getAllPortfolioCertificate(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { user_id } = validated(req, portfolioOwnerQuery);

      const result =
        await this.portfolioCertificateService.getAllPortfolioCertificate(
          user_id,
        );

      successResponse(
        res,
        result,
        "Fetched portfolio certificate successfully",
      );
    } catch (err) {
      next(err);
    }
  }

  async getPortfolioCertificateById(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = validated(req, portfolioEntryParams);

      const result =
        await this.portfolioCertificateService.getPortfolioCertificateById(id);

      if (!result) {
        throw NOT_FOUND();
      }

      successResponse(
        res,
        result,
        "Fetched portfolio certificate successfully",
      );
    } catch (err) {
      next(err);
    }
  }

  async createPortfolioCertificate(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const data = validated(req, createPortfolioCertificateBody);
      const files = uploadedFiles(req);

      const result =
        await this.portfolioCertificateService.createPortfolioCertificate(
          sessionUserId(req),
          data,
          files,
        );

      successResponse(
        res,
        result,
        "Created portfolio certificate successfully",
        201,
      );
    } catch (err) {
      next(err);
    }
  }

  async updatePortfolioCertificate(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = validated(req, portfolioEntryParams);
      const data = validated(req, updatePortfolioCertificateBody);
      const files = uploadedFiles(req);

      const result = await orNotFound(
        this.portfolioCertificateService.updatePortfolioCertificate(
          id,
          data,
          files,
        ),
        NOT_FOUND,
      );

      successResponse(
        res,
        result,
        "Updated portfolio certificate successfully",
      );
    } catch (err) {
      next(err);
    }
  }

  async deletePortfolioCertificate(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = validated(req, portfolioEntryParams);

      await orNotFound(
        this.portfolioCertificateService.deletePortfolioCertificate(id),
        NOT_FOUND,
      );

      successResponse(res, null, "Deleted portfolio certificate successfully");
    } catch (err) {
      next(err);
    }
  }
}
