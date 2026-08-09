import { NextFunction, Request, Response } from "express";
import UserService from "../services/user.service";
import { sessionUserId } from "../middlewares/auth.middleware";
import { validated } from "../validation/validate";
import { userQuery } from "../validation/identity.schema";

export default class UserController {
  private readonly userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = validated(req, userQuery);
      const courses = await this.userService.getUserDetail(id);

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
      const student_id = sessionUserId(req);
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
