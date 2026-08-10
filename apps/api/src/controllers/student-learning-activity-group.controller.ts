import { NextFunction, Request, Response } from "express";
import StudentLearningActivityGroupService from "../services/student-learning-activity-group.service";
import { sessionUserId } from "../middlewares/auth.middleware";
import { successResponse } from "../utils/response";
import { validated } from "../validation/validate";
import {
  createStudentLearningActivityGroupBody,
  studentLearningActivityGroupInSecQuery,
  studentLearningActivityGroupQuery,
  studentsWithoutLearningGroupQuery,
  updateStudentLearningActivityGroupBody,
} from "../validation/student-learning-activity-group.schema";

export default class StudentLearningActivityGroupController {
  private readonly studentLearningActivityGroupService: StudentLearningActivityGroupService;

  constructor() {
    this.studentLearningActivityGroupService =
      new StudentLearningActivityGroupService();
  }

  async createStudentLearningActivityGroup(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const body = validated(req, createStudentLearningActivityGroupBody);
      const group =
        await this.studentLearningActivityGroupService.createStudentLearningActivityGroup(
          body,
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
