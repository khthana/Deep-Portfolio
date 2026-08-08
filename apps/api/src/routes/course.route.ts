import { Router } from "express";
import CourseController from "../controllers/course.controller";
import { requireRole } from "../middlewares/auth.middleware";

const courseRouter = Router();
const courseController = new CourseController();

courseRouter.get(
  "/list",
  requireRole("TEACHER"),
  courseController.getAllCourses.bind(courseController),
);
courseRouter.get("/", courseController.getCourseDetail.bind(courseController));
courseRouter.post(
  "/schedule",
  requireRole("TEACHER"),
  courseController.createCourseSectionSchedule.bind(courseController),
);

courseRouter.get("/clo", courseController.getCLO.bind(courseController));
courseRouter.post(
  "/clo",
  requireRole("TEACHER"),
  courseController.addCLO.bind(courseController),
);
courseRouter.put(
  "/clo",
  requireRole("TEACHER"),
  courseController.updateCLO.bind(courseController),
);
courseRouter.delete(
  "/clo",
  requireRole("TEACHER"),
  courseController.deleteCLO.bind(courseController),
);

courseRouter.get(
  "/plo/list",
  courseController.getPLOList.bind(courseController),
);

export default courseRouter;
