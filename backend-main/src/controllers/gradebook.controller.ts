import express, { NextFunction, Request, Response } from "express";
import UserService from "../services/user.service";
import { GradebookService } from "../services/gradebook.service";

export default class GradebookController {
  private readonly gradebookService: GradebookService;

  constructor() {
    this.gradebookService = new GradebookService();
  }

  async getGradebookPerStudent(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const section_id = req.query?.section_id as string;
      const gradebook = await this.gradebookService.getGradebookPerStudent(
        Number(section_id),
      );

      res.status(200).json({
        success: true,
        message: "Fetched gradebook per student successfully",
        data: gradebook,
      });
    } catch (err) {
      next(err);
    }
  }

  async getGradebookPerActivity(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const section_id = req.query?.section_id as string;
      const gradebook = await this.gradebookService.getGradebookPerActivity(
        Number(section_id),
      );

      res.status(200).json({
        success: true,
        message: "Fetched gradebook per activity successfully",
        data: gradebook,
      });
    } catch (err) {
      next(err);
    }
  }
}
