import { NextFunction, Request, Response } from "express";
import GroupService from "../services/group.service";
import { successResponse } from "../utils/response";
import { validated } from "../validation/validate";
import {
  acceptInviteBody,
  validateInviteBody,
} from "../validation/group.schema";

export default class GroupController {
  private readonly groupService: GroupService;

  constructor() {
    this.groupService = new GroupService();
  }

  async acceptInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, action, type } = validated(req, acceptInviteBody);

      await this.groupService.acceptInvite(token, action, type);

      res.status(200).json({ success: true, message: "เข้าร่วมกลุ่มสำเร็จ" });
    } catch (err) {
      next(err);
    }
  }

  async validateInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, type } = validated(req, validateInviteBody);

      const status = await this.groupService.validateInvite(token, type);

      successResponse(res, status, "validate invite  successfully");
    } catch (err) {
      next(err);
    }
  }
}
