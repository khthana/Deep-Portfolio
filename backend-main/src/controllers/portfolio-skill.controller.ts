import { NextFunction, Request, Response } from "express";
import { successResponse } from "../utils/response";
import PortfolioSkillService from "../services/portfolio-skill.service";

export default class PortfolioSkillController {
  private readonly portfolioSkillService: PortfolioSkillService;

  constructor() {
    this.portfolioSkillService = new PortfolioSkillService();
  }

  async getAllPortfolioSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.query.user_id as string;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "user_id is required",
        });
      }
      const result =
        await this.portfolioSkillService.getAllPortfolioSkill(userId);

      successResponse(res, result, "Fetched portfolio skill successfully");
    } catch (err) {
      next(err);
    }
  }

  async getPortfolioWorks(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.query.user_id as string;
      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: "user_id is required" });
      }
      const result = await this.portfolioSkillService.getPortfolioWorks(userId);
      successResponse(res, result, "Fetched portfolio works successfully");
    } catch (err) {
      next(err);
    }
  }

  async getPortfolioSkillById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID",
        });
      }

      const result = await this.portfolioSkillService.getPortfolioSkillById(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Portfolio skill not found",
        });
      }

      successResponse(res, result, "Fetched portfolio skill successfully");
    } catch (err) {
      next(err);
    }
  }

  async createPortfolioSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, mappings, user_id } = req.body;

      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: "user_id is required",
        });
      }

      const result = await this.portfolioSkillService.createPortfolioSkill(
        user_id,
        {
          name,
          mappings,
        },
      );

      successResponse(res, result, "Created portfolio skill successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  async updatePortfolioSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID",
        });
      }

      const { name, mappings } = req.body;

      const result = await this.portfolioSkillService.updatePortfolioSkill(id, {
        name,
        mappings,
      });

      successResponse(res, result, "Updated portfolio skill successfully");
    } catch (err) {
      next(err);
    }
  }

  async deletePortfolioSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID",
        });
      }

      await this.portfolioSkillService.deletePortfolioSkill(id);

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
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID",
        });
      }

      const result =
        await this.portfolioSkillService.getPortfolioSkillMappingById(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Portfolio skill mapping not found",
        });
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
      const { user_id, student_activity_id, skill_ids, ...details } = req.body;

      if (!user_id) {
        return res
          .status(400)
          .json({ success: false, message: "user_id is required" });
      }
      if (!student_activity_id) {
        return res
          .status(400)
          .json({ success: false, message: "student_activity_id is required" });
      }
      if (!Array.isArray(skill_ids) || skill_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "skill_ids must be a non-empty array",
        });
      }

      await this.portfolioSkillService.assignWorkToSkills({
        user_id,
        student_activity_id,
        skill_ids,
        ...details,
      });

      successResponse(res, null, "Work assigned to skills successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  async deleteSkillMapping(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid mapping ID" });
      }
      await this.portfolioSkillService.deleteSkillMapping(id);
      successResponse(res, null, "Mapping deleted successfully");
    } catch (err) {
      next(err);
    }
  }
}
