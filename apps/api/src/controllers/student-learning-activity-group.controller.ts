import { NextFunction, Request, Response } from "express";
import StudentLearningActivityGroupService from "../services/student-learning-activity-group.service";
import GroupService from "../services/group.service";
import { sessionUserId } from "../middlewares/auth.middleware";
import { successResponse } from "../utils/response";
import { validated } from "../validation/validate";
import {
  groupParams,
  resendInviteBody,
} from "../validation/student-activity-group.schema";
import {
  createStudentLearningActivityGroupBody,
  studentLearningActivityGroupInSecQuery,
  studentLearningActivityGroupQuery,
  studentsWithoutLearningGroupQuery,
  updateStudentLearningActivityGroupBody,
} from "../validation/student-learning-activity-group.schema";

export default class StudentLearningActivityGroupController {
  private readonly studentLearningActivityGroupService: StudentLearningActivityGroupService;
  /** Re-inviting a member is the same work on both kinds of group, so it lives
   *  once in GroupService, and this controller is what says which kind asked
   *  (#57). */
  private readonly groupService: GroupService;

  constructor() {
    this.studentLearningActivityGroupService =
      new StudentLearningActivityGroupService();
    this.groupService = new GroupService();
  }

  async createStudentLearningActivityGroup(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const body = validated(req, createStudentLearningActivityGroupBody);
      // Who created the group comes from the session, not from the list (#37).
      const group =
        await this.studentLearningActivityGroupService.createStudentLearningActivityGroup(
          body,
          sessionUserId(req),
        );

      successResponse(res, group, "Create group successfully");
    } catch (err) {
      next(err);
    }
  }

  async updateStudentLearningActivityGroup(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const body = validated(req, updateStudentLearningActivityGroupBody);
      const group =
        await this.studentLearningActivityGroupService.updateStudentLearningActivityGroup(
          body,
        );

      successResponse(res, group, "Update group successfully");
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
        "learning-activity",
      );

      successResponse(res, null, "Resend invite successfully");
    } catch (err) {
      next(err);
    }
  }

  async deleteStudentLearningActivityGroup(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { group_id } = validated(req, groupParams);
      await this.studentLearningActivityGroupService.deleteStudentLearningActivityGroup(
        group_id,
      );

      successResponse(res, null, "Delete group successfully");
    } catch (err) {
      next(err);
    }
  }

  //   เพื่อเช็คว่าเคยสร้างกลุ่มของกิจกรรมนั้นๆหรือยัง
  async getStudentLearningActivityGroup(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { learning_activity_id } = validated(
        req,
        studentLearningActivityGroupQuery,
      );
      const group =
        await this.studentLearningActivityGroupService.getStudentLearningActivityGroup(
          sessionUserId(req),
          learning_activity_id,
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
      const { section_id, learning_activity_id } = validated(
        req,
        studentsWithoutLearningGroupQuery,
      );
      const group =
        await this.studentLearningActivityGroupService.getStudentsWithoutGroup(
          section_id,
          learning_activity_id,
        );

      successResponse(res, group, "fetch group successfully");
    } catch (err) {
      next(err);
    }
  }

  //   เพื่อเช็คว่าเคยสร้างกลุ่มของกิจกรรมนั้นๆหรือยัง
  async getStudentLearningActivityGroupInSec(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { section_id } = validated(
        req,
        studentLearningActivityGroupInSecQuery,
      );
      const group =
        await this.studentLearningActivityGroupService.getStudentLearningActivityGroupInSec(
          section_id,
          sessionUserId(req),
        );

      successResponse(res, group, "fetch group successfully");
    } catch (err) {
      next(err);
    }
  }
}
