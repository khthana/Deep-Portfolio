import { NextFunction, Request, Response } from "express";
import { uploadedFiles } from "../utils/uploaded-files";
import StudentService from "../services/student.service";
import { sessionUserId } from "../middlewares/auth.middleware";
import { successResponse } from "../utils/response";
import { HttpError } from "../utils/http-error";
import { validated } from "../validation/validate";
import {
  activityDetailsParams,
  sectionActivitiesQuery,
  studentClassworkListQuery,
  studentListQuery,
  studentTermQuery,
  submitActivityBody,
  submitLearningActivityBody,
} from "../validation/student.schema";

export default class StudentController {
  private readonly studentService: StudentService;

  constructor() {
    this.studentService = new StudentService();
  }

  async getStudentInSec(req: Request, res: Response, next: NextFunction) {
    try {
      const { section_id } = validated(req, studentListQuery);
      const courses = await this.studentService.getStudentInSec(section_id);

      successResponse(res, courses, "Fetched student in section successfully");
    } catch (err) {
      next(err);
    }
  }

  async submitActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const body = validated(req, submitActivityBody);
      const files = uploadedFiles(req);
      const data = { ...body, student_id: sessionUserId(req), files };

      const activity =
        data.type === "INDIVIDUAL"
          ? await this.studentService.submitActivity(data)
          : await this.studentService.submitGroupActivity(data);

      successResponse(res, activity, "submit activity successfully");
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
      const body = validated(req, submitLearningActivityBody);
      const files = uploadedFiles(req);
      const data = { ...body, student_id: sessionUserId(req), files };

      const activity =
        data.type === "INDIVIDUAL"
          ? await this.studentService.submitLearningActivity(data)
          : await this.studentService.submitGroupLearningActivity(data);

      successResponse(res, activity, "submit activity successfully");
    } catch (err) {
      next(err);
    }
  }

  async getStudentCourseList(req: Request, res: Response, next: NextFunction) {
    try {
      const student_id = sessionUserId(req);
      const { semester, academic_year } = validated(req, studentTermQuery);

      const courses = await this.studentService.getStudentCourseList(
        student_id,
        semester,
        academic_year,
      );

      successResponse(res, courses, "Fetched course list successfully");
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
      const student_id = sessionUserId(req);
      const { semester, academic_year } = validated(req, studentTermQuery);

      const courses = await this.studentService.getStudentCalendarEvent(
        student_id,
        semester,
        academic_year,
      );

      successResponse(res, courses, "Fetched calendar event successfully");
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
      const student_id = sessionUserId(req);
      const { section_id } = validated(req, studentClassworkListQuery);

      const courses = await this.studentService.getStudentCourseClassworkList(
        student_id,
        section_id,
      );

      successResponse(res, courses, "Fetched classwork list successfully");
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
      const student_id = sessionUserId(req);
      const { semester, academic_year } = validated(req, studentTermQuery);

      const courses = await this.studentService.getStudentAllClassworkList(
        student_id,
        semester,
        academic_year,
      );

      successResponse(res, courses, "Fetched classwork list successfully");
    } catch (err) {
      next(err);
    }
  }

  async getEnrolledSubjects(req: Request, res: Response, next: NextFunction) {
    try {
      const student_id = sessionUserId(req);

      const subjects =
        await this.studentService.getEnrolledSubjects(student_id);

      successResponse(res, subjects, "Fetched enrolled subjects successfully");
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
      const { section_id, student_id } = validated(req, sectionActivitiesQuery);

      const activities = await this.studentService.getActivitiesBySectionId(
        section_id,
        student_id,
      );

      successResponse(
        res,
        activities,
        "Fetched activities by section successfully",
      );
    } catch (err) {
      next(err);
    }
  }

  async getActivityDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { student_activity_id } = validated(req, activityDetailsParams);
      const activity =
        await this.studentService.getActivityDetailsByStudentActivityId(
          student_activity_id,
        );

      // The only endpoint left that built its own refusal by hand. It answered
      // in English, and past the middleware, so it was the one 404 in the
      // system whose shape nobody else could change.
      if (!activity) {
        throw new HttpError(404, "ไม่พบงานที่ต้องการ");
      }

      successResponse(res, activity, "Fetched activity details successfully");
    } catch (err) {
      next(err);
    }
  }
}
