import express, { NextFunction, Request, Response } from "express";
import StudentActivityGroupService from "../services/student-activity-group.service";
import {
  CreateStudentActivityGroupBody,
  UpdateStudentActivityGroupBody,
} from "../models/student-activity-group.model";
import StudentLearningActivityGroupService from "../services/student-learning-activity-group.service";
import {
  CreateStudentLearningActivityGroupBody,
  UpdateStudentLearningActivityGroupBody,
} from "../models/student-learning-activity-group.model";

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
      const data: CreateStudentLearningActivityGroupBody = {
        learning_activity_id: req.body.learning_activity_id,
        members: req.body.members,
      };
      const group =
        await this.studentLearningActivityGroupService.createStudentLearningActivityGroup(
          data,
        );

      res.status(200).json({
        success: true,
        message: "Create group successfully",
        data: group,
      });
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
      const data: UpdateStudentLearningActivityGroupBody = {
        group_id: req.body.group_id,
        members: req.body.members,
      };
      const group =
        await this.studentLearningActivityGroupService.updateStudentLearningActivityGroup(
          data,
        );

      res.status(200).json({
        success: true,
        message: "Update group successfully",
        data: group,
      });
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
      const student_id = req.query?.student_id as string;
      const learning_activity_id = req.query?.learning_activity_id as string;
      const group =
        await this.studentLearningActivityGroupService.getStudentLearningActivityGroup(
          student_id,
          parseInt(learning_activity_id),
        );

      res.status(200).json({
        success: true,
        message: "fetch group successfully",
        data: group,
      });
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
      const section_id = req.query?.section_id as string;
      const learning_activity_id = req.query?.learning_activity_id as string;
      const group =
        await this.studentLearningActivityGroupService.getStudentsWithoutGroup(
          parseInt(section_id),
          parseInt(learning_activity_id),
        );

      res.status(200).json({
        success: true,
        message: "fetch group successfully",
        data: group,
      });
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
      const student_id = req.query?.student_id as string;
      const section_id = req.query?.section_id as string;
      const group =
        await this.studentLearningActivityGroupService.getStudentLearningActivityGroupInSec(
          parseInt(section_id),
          student_id,
        );

      res.status(200).json({
        success: true,
        message: "fetch group successfully",
        data: group,
      });
    } catch (err) {
      next(err);
    }
  }
}
