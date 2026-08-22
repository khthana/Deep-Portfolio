import { NextFunction, Request, Response } from "express";
import UserService from "../services/user.service";
import { successResponse } from "../utils/response";
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
      const user = await this.userService.getUserDetail(id);

      successResponse(res, user, "Fetched user successfully");
    } catch (err) {
      next(err);
    }
  }

  async getStudentDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const student_id = sessionUserId(req);
      const student = await this.userService.getStudentDetail(student_id);

      successResponse(res, student, "Fetched student successfully");
    } catch (err) {
      next(err);
    }
  }
}
