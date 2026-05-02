import express, { NextFunction, Request, Response } from "express";
import UserService from "../services/user.service";
import { AuthRequest } from "../middlewares/auth.middleware";

export default class UserController {
  private readonly userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.query?.id as string;
      const courses = await this.userService.getUserDetail(
        userId ?? "cf906503",
      );

      res.status(200).json({
        success: true,
        message: "Fetched user successfully",
        data: courses,
      });
    } catch (err) {
      next(err);
    }
  }

  async getStudentDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const student_id = (req as AuthRequest).user?.user_id;
      const courses = await this.userService.getStudentDetail(student_id);

      res.status(200).json({
        success: true,
        message: "Fetched student successfully",
        data: courses,
      });
    } catch (err) {
      next(err);
    }
  }
}
