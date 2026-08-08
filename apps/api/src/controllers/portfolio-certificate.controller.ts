import { NextFunction, Request, Response } from "express";
import { successResponse } from "../utils/response";
import PortfolioCertificateService from "../services/portfolio-certificate.service";

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
      const userId = req.query.user_id as string;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "user_id is required",
        });
      }

      const result =
        await this.portfolioCertificateService.getAllPortfolioCertificate(
          userId,
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
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID",
        });
      }

      const result =
        await this.portfolioCertificateService.getPortfolioCertificateById(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Portfolio certificate not found",
        });
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

      const result =
        await this.portfolioCertificateService.createPortfolioCertificate(
          user_id,
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

      const result =
        await this.portfolioCertificateService.updatePortfolioCertificate(
          id,
          data,
          files,
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
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID",
        });
      }

      await this.portfolioCertificateService.deletePortfolioCertificate(id);

      successResponse(res, null, "Deleted portfolio certificate successfully");
    } catch (err) {
      next(err);
    }
  }
}
