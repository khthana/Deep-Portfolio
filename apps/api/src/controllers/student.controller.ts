import express, { NextFunction, Request, Response } from "express";
import StudentService from "../services/student.service";
import {
  ClassworkType,
  SubmitActivityBody,
  SubmitLearningActivityBody,
} from "../models/student.model";
import { AuthRequest } from "../middlewares/auth.middleware";

export default class StudentController {
  private readonly studentService: StudentService;

  constructor() {
    this.studentService = new StudentService();
  }

  async getStudentInSec(req: Request, res: Response, next: NextFunction) {
    try {
      const section_id = req.query?.section_id as string;
      const courses = await this.studentService.getStudentInSec(
        parseInt(section_id),
      );

      res.status(200).json({
        success: true,
        message: "Fetched student in section successfully",
        data: courses,
      });
    } catch (err) {
      next(err);
    }
  }

  async submitActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      const student_id = (req as AuthRequest).user?.user_id;

      const urlList: { title: string; url: string; uploaded_by: string }[] = req
        .body.urls
        ? JSON.parse(req.body.urls)
        : [];

      const existing_files_ids: number[] = req.body.existing_files_ids
        ? JSON.parse(req.body.existing_files_ids)
        : [];

      const data: SubmitActivityBody = {
        student_activity_id: parseInt(req.body.student_activity_id),
        section_id: parseInt(req.body.section_id),
        activity_id: parseInt(req.body.activity_id),
        student_id: student_id,
        files: files,
        urls: urlList,
        existing_files_ids: existing_files_ids,
        type: req.body.type,
        group_id: req.body.group_id ? parseInt(req.body.group_id) : undefined,
      };

      const activity =
        data.type === "INDIVIDUAL"
          ? await this.studentService.submitActivity(data)
          : await this.studentService.submitGroupActivity(data);

      console.log(activity);
      res.status(200).json({
        success: true,
        message: "submit activity successfully",
        data: activity,
      });
    } catch (err) {
      next(err);
    }
  }

  async submitLearningActivity(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const files = req.files as Express.Multer.File[];
      const student_id = (req as AuthRequest).user?.user_id;
      const urlList: { title: string; url: string; uploaded_by: string }[] = req
        .body.urls
        ? JSON.parse(req.body.urls)
        : [];

      const existing_files_ids: number[] = req.body.existing_files_ids
        ? JSON.parse(req.body.existing_files_ids)
        : [];

      const data: SubmitLearningActivityBody = {
        student_learning_activity_id: parseInt(
          req.body.student_learning_activity_id,
        ),
        section_id: parseInt(req.body.section_id),
        learning_activity_id: parseInt(req.body.learning_activity_id),
        student_id: student_id,
        files: files,
        urls: urlList,
        existing_files_ids: existing_files_ids,
        type: req.body.type,
        group_id: req.body.group_id ? parseInt(req.body.group_id) : undefined,
      };

      const activity =
        data.type === ClassworkType.INDIVIDUAL
          ? await this.studentService.submitLearningActivity(data)
          : await this.studentService.submitGroupLearningActivity(data);

      res.status(200).json({
        success: true,
        message: "submit activity successfully",
        data: activity,
      });
    } catch (err) {
      next(err);
    }
  }

  async getStudentCourseList(req: Request, res: Response, next: NextFunction) {
    try {
      const student_id = (req as AuthRequest).user?.user_id;

      const semester = req.query?.semester as string;
      const academic_year = req.query?.academic_year as string;

      const courses = await this.studentService.getStudentCourseList(
        student_id,
        parseInt(semester),
        academic_year,
      );

      res.status(200).json({
        success: true,
        message: "Fetched course list successfully",
        data: courses,
      });
    } catch (err) {
      next(err);
    }
  }

  async getStudentCalendarEvent(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const student_id = (req as AuthRequest).user?.user_id;

      const semester = req.query?.semester as string;
      const academic_year = req.query?.academic_year as string;

      const courses = await this.studentService.getStudentCalendarEvent(
        student_id,
        parseInt(semester),
        academic_year,
      );

      res.status(200).json({
        success: true,
        message: "Fetched calendar event successfully",
        data: courses,
      });
    } catch (err) {
      next(err);
    }
  }

  async getStudentCourseClassworkList(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const student_id = (req as AuthRequest).user?.user_id;

      const section_id = req.query?.section_id as string;

      const courses = await this.studentService.getStudentCourseClassworkList(
        student_id,
        parseInt(section_id),
      );

      res.status(200).json({
        success: true,
        message: "Fetched classwork list successfully",
        data: courses,
      });
    } catch (err) {
      next(err);
    }
  }

  async getStudentAllClassworkList(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const student_id = (req as AuthRequest).user?.user_id;
      const semester = req.query?.semester as string;
      const academic_year = req.query?.academic_year as string;

      const courses = await this.studentService.getStudentAllClassworkList(
        student_id,
        parseInt(semester),
        academic_year,
      );

      res.status(200).json({
        success: true,
        message: "Fetched classwork list successfully",
        data: courses,
      });
    } catch (err) {
      next(err);
    }
  }

  async getEnrolledSubjects(req: Request, res: Response, next: NextFunction) {
    try {
      const student_id = req.query?.student_id as string;

      const subjects =
        await this.studentService.getEnrolledSubjects(student_id);

      res.status(200).json({
        success: true,
        message: "Fetched enrolled subjects successfully",
        data: subjects,
      });
    } catch (err) {
      next(err);
    }
  }

  async getActivitiesBySectionId(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const section_id = req.query?.section_id as string;
      const student_id = req.query?.student_id as string;

      const activities = await this.studentService.getActivitiesBySectionId(
        parseInt(section_id),
        student_id,
      );

      res.status(200).json({
        success: true,
        message: "Fetched activities by section successfully",
        data: activities,
      });
    } catch (err) {
      next(err);
    }
  }

  async getActivityDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const student_activity_id = req.params?.student_activity_id;
      const activity =
        await this.studentService.getActivityDetailsByStudentActivityId(
          parseInt(student_activity_id),
        );

      if (!activity) {
        return res.status(404).json({
          success: false,
          message: "Student activity not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Fetched activity details successfully",
        data: activity,
      });
    } catch (err) {
      next(err);
    }
  }
}
