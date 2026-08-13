import { NextFunction, Request, Response } from "express";
import StudentActivityGroupService from "../services/student-activity-group.service";
import GroupService from "../services/group.service";
import { sessionUserId } from "../middlewares/auth.middleware";
import { successResponse } from "../utils/response";
import { validated } from "../validation/validate";
import {
  createStudentActivityGroupBody,
  groupParams,
  resendInviteBody,
  studentActivityGroupInSecQuery,
  studentActivityGroupQuery,
  studentsWithoutGroupQuery,
  updateStudentActivityGroupBody,
} from "../validation/student-activity-group.schema";

export default class StudentActivityGroupController {
  private readonly studentActivityGroupService: StudentActivityGroupService;
  /** Re-inviting a member is the same work on both kinds of group, so it lives
   *  once in GroupService, and this controller is what says which kind asked
   *  (#57). */
  private readonly groupService: GroupService;

  constructor() {
    this.studentActivityGroupService = new StudentActivityGroupService();
    this.groupService = new GroupService();
  }

  async createStudentActivityGroup(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const body = validated(req, createStudentActivityGroupBody);
      // Who created the group comes from the session, not from the list (#37).
      const group =
        await this.studentActivityGroupService.createStudentActivityGroup(
          body,
          sessionUserId(req),
        );

      successResponse(res, group, "Create group successfully");
    } catch (err) {
      next(err);
    }
  }

  async updateStudentActivityGroup(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const body = validated(req, updateStudentActivityGroupBody);
      const group =
        await this.studentActivityGroupService.updateStudentActivityGroup(body);

      successResponse(res, group, "Create group successfully");
    } catch (err) {
      next(err);
    }
  }

  async resendInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const { group_id, student_id } = validated(req, resendInviteBody);
      // Who the invitation comes from is the session's, not the body's — the
      // same rule the rest of these endpoints follow (ADR-0001).
      await this.groupService.resendInvite(
        group_id,
        student_id,
        sessionUserId(req),
        "activity",
      );

      successResponse(res, null, "Resend invite successfully");
    } catch (err) {
      next(err);
    }
  }

  async deleteStudentActivityGroup(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { group_id } = validated(req, groupParams);
      await this.studentActivityGroupService.deleteStudentActivityGroup(
        group_id,
      );

      successResponse(res, null, "Delete group successfully");
    } catch (err) {
      next(err);
    }
  }

  //   เพื่อเช็คว่าเคยสร้างกลุ่มของกิจกรรมนั้นๆหรือยัง
  async getStudentActivityGroup(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { activity_id } = validated(req, studentActivityGroupQuery);
      const group =
        await this.studentActivityGroupService.getStudentActivityGroup(
          sessionUserId(req),
          activity_id,
        );

      successResponse(res, group, "fetch group successfully");
    } catch (err) {
      next(err);
    }
  }

  async getStudentWithoutGroup(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { section_id, activity_id } = validated(
        req,
        studentsWithoutGroupQuery,
      );
      const group =
        await this.studentActivityGroupService.getStudentsWithoutGroup(
          section_id,
          activity_id,
        );

      successResponse(res, group, "fetch group successfully");
    } catch (err) {
      next(err);
    }
  }

  //   เพื่อเช็คว่าเคยสร้างกลุ่มของกิจกรรมนั้นๆหรือยัง
  async getStudentActivityGroupInSec(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { section_id } = validated(req, studentActivityGroupInSecQuery);
      const group =
        await this.studentActivityGroupService.getStudentActivityGroupInSec(
          section_id,
          sessionUserId(req),
        );

      successResponse(res, group, "fetch group successfully");
    } catch (err) {
      next(err);
    }
  }
}
