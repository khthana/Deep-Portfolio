import { NextFunction, Request, Response } from "express";
import GroupService from "../services/group.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import UserService from "../services/user.service";
import { successResponse } from "../utils/response";

export default class GroupController {
  private readonly groupService: GroupService;
  private readonly userService: UserService;

  constructor() {
    this.groupService = new GroupService();
    this.userService = new UserService();
  }

  //   async inviteMember(req: AuthRequest, res: Response, next: NextFunction) {
  //     try {
  //       const { groupId } = req.params;
  //       const { email } = req.body;
  //       const inviterId = req.user?.user_id;

  //       if (!email) {
  //         return res.status(400).json({ message: "ต้องระบุอีเมล" });
  //       }
  //       if (!inviterId) {
  //         return res.status(401).json({ message: "ไม่ได้รับอนุญาต" });
  //       }

  //       const inviter = await this.userService.getUserDetail(inviterId);
  //       if (!inviter) {
  //         return res.status(404).json({ message: "ไม่พบผู้ใช้ที่ทำการเชิญ" });
  //       }
  //       const inviterName = `${inviter.first_name_th} ${inviter.last_name_th}`;

  //       await this.groupService.inviteMember(email, inviterName);

  //       res.status(200).json({ success: true, message: "ส่งคำเชิญสำเร็จ" });
  //     } catch (err) {
  //       next(err);
  //     }
  //   }

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
