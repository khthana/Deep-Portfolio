import { NextFunction, Request, Response } from "express";
import CourseService from "../services/course.service";
import { successResponse } from "../utils/response";
import UserService from "../services/user.service";
import CLOService from "../services/clo.service";
import PLOService from "../services/plo.service";
import { AuthRequest } from "../middlewares/auth.middleware";

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
      const teacher_id = (req as AuthRequest).user?.user_id;

      // const teacher_id = req.query?.teacher_id as string;
      const academic_year = req.query?.academic_year as string;
      const semester = req.query?.semester as string;

      const courses = await this.courseService.getAllCourses({
        teacher_id,
        academic_year,
        semester: parseInt(semester),
      });

      successResponse(res, courses, "Fetched courses successfully");
    } catch (err) {
      next(err);
    }
  }

  async getCourseDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const section_id = req.query?.section_id as string;

      const course = await this.courseService.getCourseDetail(
        parseInt(section_id),
      );

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
        req.body,
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
      const section_id = req.query?.section_id as string;

      const clo = await this.cloService.getCLO(parseInt(section_id));

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
      const clo = await this.cloService.addCLO(req.body);

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
      const clo = await this.cloService.updateCLO(req.body);

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
      const clo_id = req.query?.clo_id as string;

      const clo = await this.cloService.deleteCLO(parseInt(clo_id));

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
      const program_id = req.query?.program_id as string;

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
