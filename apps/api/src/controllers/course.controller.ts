import { NextFunction, Request, Response } from "express";
import CourseService from "../services/course.service";
import { successResponse } from "../utils/response";
import CLOService from "../services/clo.service";
import PLOService from "../services/plo.service";
import { sessionUserId } from "../middlewares/auth.middleware";
import { validated } from "../validation/validate";
import {
  addCLOBody,
  cloQuery,
  courseDetailQuery,
  createScheduleBody,
  deleteCLOQuery,
  ploListQuery,
  teacherCourseListQuery,
  updateCLOBody,
} from "../validation/course.schema";

export default class CourseController {
  private readonly courseService: CourseService;
  private readonly cloService: CLOService;
  private readonly ploService: PLOService;

  constructor() {
    this.courseService = new CourseService();
    this.cloService = new CLOService();
    this.ploService = new PLOService();
  }

  async getAllCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const teacher_id = sessionUserId(req);
      const { academic_year, semester } = validated(
        req,
        teacherCourseListQuery,
      );

      const courses = await this.courseService.getAllCourses({
        teacher_id,
        academic_year,
        semester,
      });

      successResponse(res, courses, "Fetched courses successfully");
    } catch (err) {
      next(err);
    }
  }

  async getCourseDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { section_id } = validated(req, courseDetailQuery);

      const course = await this.courseService.getCourseDetail(section_id);

      successResponse(res, course, "Fetched course successfully");
    } catch (err) {
      next(err);
    }
  }

  async createCourseSectionSchedule(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const course = await this.courseService.createCourseSectionSchedule(
        validated(req, createScheduleBody),
      );

      successResponse(
        res,
        course,
        "Created course section schedule successfully",
      );
    } catch (err) {
      next(err);
    }
  }

  //---------------------------------------------------------------------------

  async getCLO(req: Request, res: Response, next: NextFunction) {
    try {
      const { section_id } = validated(req, cloQuery);

      const clo = await this.cloService.getCLO(section_id);

      res.status(200).json({
        success: true,
        message: "get clo successfully",
        data: clo,
      });
    } catch (err) {
      next(err);
    }
  }

  async addCLO(req: Request, res: Response, next: NextFunction) {
    try {
      const clo = await this.cloService.addCLO(validated(req, addCLOBody));

      res.status(200).json({
        success: true,
        message: "add clo successfully",
        data: clo,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateCLO(req: Request, res: Response, next: NextFunction) {
    try {
      const clo = await this.cloService.updateCLO(
        validated(req, updateCLOBody),
      );

      res.status(200).json({
        success: true,
        message: "update clo successfully",
        data: clo,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteCLO(req: Request, res: Response, next: NextFunction) {
    try {
      const { clo_id } = validated(req, deleteCLOQuery);

      const clo = await this.cloService.deleteCLO(clo_id);

      res.status(200).json({
        success: true,
        message: "delete clo successfully",
        data: clo,
      });
    } catch (err) {
      next(err);
    }
  }

  //--------------------------------------------------------------
  async getPLOList(req: Request, res: Response, next: NextFunction) {
    try {
      const { program_id } = validated(req, ploListQuery);

      const plo = await this.ploService.getPLOList(program_id);

      res.status(200).json({
        success: true,
        message: "get plo successfully",
        data: plo,
      });
    } catch (err) {
      next(err);
    }
  }
}
