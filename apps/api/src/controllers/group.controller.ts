import { NextFunction, Request, Response } from "express";
import GroupService from "../services/group.service";
import { successResponse } from "../utils/response";

export default class GroupController {
  private readonly groupService: GroupService;

  constructor() {
    this.groupService = new GroupService();
  }

  async acceptInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, action, type } = req.body;
      if (!token) {
        return res.status(400).json({ message: "ต้องระบุ Token" });
      }

      await this.groupService.acceptInvite(token, action, type);

      res.status(200).json({ success: true, message: "เข้าร่วมกลุ่มสำเร็จ" });
    } catch (err) {
      next(err);
    }
  }

  async validateInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, type } = req.body;
      if (!token) {
        return res.status(400).json({ message: "ต้องระบุ Token" });
      }

      const status = await this.groupService.validateInvite(token, type);

      successResponse(res, status, "validate invite  successfully");
    } catch (err) {
      next(err);
    }
  }
}
