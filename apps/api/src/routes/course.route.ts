import { Router } from "express";
import CourseController from "../controllers/course.controller";
import { requireRole } from "../middlewares/auth.middleware";
import { validate } from "../validation/validate";
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

const courseRouter = Router();
const courseController = new CourseController();

// validate() sits after requireRole() throughout, so a caller who is not
// allowed here at all is still told that first, rather than having their
// request picked apart for them.
courseRouter.get(
  "/list",
  requireRole("TEACHER"),
  validate({ query: teacherCourseListQuery }),
  courseController.getAllCourses.bind(courseController),
);
courseRouter.get(
  "/",
  validate({ query: courseDetailQuery }),
  courseController.getCourseDetail.bind(courseController),
);
courseRouter.post(
  "/schedule",
  requireRole("TEACHER"),
  validate({ body: createScheduleBody }),
  courseController.createCourseSectionSchedule.bind(courseController),
);

courseRouter.get(
  "/clo",
  validate({ query: cloQuery }),
  courseController.getCLO.bind(courseController),
);
courseRouter.post(
  "/clo",
  requireRole("TEACHER"),
  validate({ body: addCLOBody }),
  courseController.addCLO.bind(courseController),
);
courseRouter.put(
  "/clo",
  requireRole("TEACHER"),
  validate({ body: updateCLOBody }),
  courseController.updateCLO.bind(courseController),
);
courseRouter.delete(
  "/clo",
  requireRole("TEACHER"),
  validate({ query: deleteCLOQuery }),
  courseController.deleteCLO.bind(courseController),
);

courseRouter.get(
  "/plo/list",
  validate({ query: ploListQuery }),
  courseController.getPLOList.bind(courseController),
);

export default courseRouter;
