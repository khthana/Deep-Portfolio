import { Router } from "express";
import CourseController from "../controllers/course.controller";
import { verifyTeacher } from "../middlewares/auth.middleware";

const courseRouter = Router();
const courseController = new CourseController();

courseRouter.get(
  "/list",
  verifyTeacher,
  courseController.getAllCourses.bind(courseController),
);
courseRouter.get("/", courseController.getCourseDetail.bind(courseController));
courseRouter.post(
  "/schedule",
  verifyTeacher,
  courseController.createCourseSectionSchedule.bind(courseController),
);

courseRouter.get("/clo", courseController.getCLO.bind(courseController));
courseRouter.post(
  "/clo",
  verifyTeacher,
  courseController.addCLO.bind(courseController),
);
courseRouter.put(
  "/clo",
  verifyTeacher,
  courseController.updateCLO.bind(courseController),
);
courseRouter.delete(
  "/clo",
  verifyTeacher,
  courseController.deleteCLO.bind(courseController),
);

courseRouter.get(
  "/plo/list",
  courseController.getPLOList.bind(courseController),
);

export default courseRouter;
