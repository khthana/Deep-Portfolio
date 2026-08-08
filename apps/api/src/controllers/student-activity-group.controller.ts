import express, { NextFunction, Request, Response } from "express";
import StudentActivityGroupService from "../services/student-activity-group.service";
import {
  CreateStudentActivityGroupBody,
  UpdateStudentActivityGroupBody,
} from "../models/student-activity-group.model";

export default class StudentActivityGroupController {
  private readonly studentActivityGroupService: StudentActivityGroupService;

  constructor() {
    this.studentActivityGroupService = new StudentActivityGroupService();
  }

  async createStudentActivityGroup(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const data: CreateStudentActivityGroupBody = {
        activity_id: req.body.activity_id,
        members: req.body.members,
      };
      const group =
        await this.studentActivityGroupService.createStudentActivityGroup(data);

      res.status(200).json({
        success: true,
        message: "Create group successfully",
        data: group,
      });
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
      const data: UpdateStudentActivityGroupBody = {
        group_id: req.body.group_id,
        members: req.body.members,
      };
      const group =
        await this.studentActivityGroupService.updateStudentActivityGroup(data);

      res.status(200).json({
        success: true,
        message: "Create group successfully",
        data: group,
      });
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
      const student_id = req.query?.student_id as string;
      const activity_id = req.query?.activity_id as string;
      const group =
        await this.studentActivityGroupService.getStudentActivityGroup(
          student_id,
          parseInt(activity_id),
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
      const activity_id = req.query?.activity_id as string;
      const group =
        await this.studentActivityGroupService.getStudentsWithoutGroup(
          parseInt(section_id),
          parseInt(activity_id),
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
  async getStudentActivityGroupInSec(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const student_id = req.query?.student_id as string;
      const section_id = req.query?.section_id as string;
      const group =
        await this.studentActivityGroupService.getStudentActivityGroupInSec(
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
