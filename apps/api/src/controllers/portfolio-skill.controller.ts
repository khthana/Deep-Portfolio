import { NextFunction, Request, Response } from "express";
import { sessionUserId } from "../middlewares/auth.middleware";
import { successResponse } from "../utils/response";
import { HttpError } from "../utils/http-error";
import { orNotFound } from "../utils/record-not-found";
import PortfolioSkillService from "../services/portfolio-skill.service";
import {
  assignWorkToSkillsBody,
  createPortfolioSkillBody,
  updatePortfolioSkillBody,
} from "../validation/portfolio-skill.schema";
import {
  portfolioEntryParams,
  portfolioOwnerQuery,
} from "../validation/portfolio.schema";
import { validated } from "../validation/validate";

const SKILL_NOT_FOUND = () => new HttpError(404, "ไม่พบทักษะที่ต้องการ");
const MAPPING_NOT_FOUND = () =>
  new HttpError(404, "ไม่พบการเชื่อมโยงชิ้นงานกับทักษะที่ต้องการ");

export default class PortfolioSkillController {
  private readonly portfolioSkillService: PortfolioSkillService;

  constructor() {
    this.portfolioSkillService = new PortfolioSkillService();
  }

  async getAllPortfolioSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const { user_id } = validated(req, portfolioOwnerQuery);

      const result =
        await this.portfolioSkillService.getAllPortfolioSkill(user_id);

      successResponse(res, result, "Fetched portfolio skill successfully");
    } catch (err) {
      next(err);
    }
  }

  async getPortfolioWorks(req: Request, res: Response, next: NextFunction) {
    try {
      const { user_id } = validated(req, portfolioOwnerQuery);

      const result =
        await this.portfolioSkillService.getPortfolioWorks(user_id);

      successResponse(res, result, "Fetched portfolio works successfully");
    } catch (err) {
      next(err);
    }
  }

  async getPortfolioSkillById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = validated(req, portfolioEntryParams);

      const result = await this.portfolioSkillService.getPortfolioSkillById(id);

      if (!result) {
        throw SKILL_NOT_FOUND();
      }

      successResponse(res, result, "Fetched portfolio skill successfully");
    } catch (err) {
      next(err);
    }
  }

  async createPortfolioSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const data = validated(req, createPortfolioSkillBody);

      const result = await this.portfolioSkillService.createPortfolioSkill(
        sessionUserId(req),
        data,
      );

      successResponse(res, result, "Created portfolio skill successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  async updatePortfolioSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = validated(req, portfolioEntryParams);
      const data = validated(req, updatePortfolioSkillBody);

      const result = await orNotFound(
        this.portfolioSkillService.updatePortfolioSkill(id, data),
        SKILL_NOT_FOUND,
      );

      successResponse(res, result, "Updated portfolio skill successfully");
    } catch (err) {
      next(err);
    }
  }

  async deletePortfolioSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = validated(req, portfolioEntryParams);

      await orNotFound(
        this.portfolioSkillService.deletePortfolioSkill(id),
        SKILL_NOT_FOUND,
      );

      successResponse(res, null, "Deleted portfolio skill successfully");
    } catch (err) {
      next(err);
    }
  }

  async getPortfolioSkillMappingById(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = validated(req, portfolioEntryParams);

      const result =
        await this.portfolioSkillService.getPortfolioSkillMappingById(id);

      if (!result) {
        throw MAPPING_NOT_FOUND();
      }

      successResponse(
        res,
        result,
        "Fetched portfolio skill mapping successfully",
      );
    } catch (err) {
      next(err);
    }
  }

  async assignWorkToSkills(req: Request, res: Response, next: NextFunction) {
    try {
      const data = validated(req, assignWorkToSkillsBody);

      await this.portfolioSkillService.assignWorkToSkills(
        sessionUserId(req),
        data,
      );

      successResponse(res, null, "Work assigned to skills successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  async deleteSkillMapping(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = validated(req, portfolioEntryParams);

      await orNotFound(
        this.portfolioSkillService.deleteSkillMapping(id),
        MAPPING_NOT_FOUND,
      );
      successResponse(res, null, "Mapping deleted successfully");
    } catch (err) {
      next(err);
    }
  }
}
