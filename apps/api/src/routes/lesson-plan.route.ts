import { Router } from "express";
import CourseController from "../controllers/course.controller";
import LessonPlanController from "../controllers/lesson-plan.controller";
import { requireRole } from "../middlewares/auth.middleware";

const lessonPlanRouter = Router();
const lessonPlanController = new LessonPlanController();

lessonPlanRouter.get(
  "/",
  lessonPlanController.getLessonPlan.bind(lessonPlanController),
);

lessonPlanRouter.post(
  "/",
  requireRole("TEACHER"),

  lessonPlanController.addLessonPlan.bind(lessonPlanController),
);

lessonPlanRouter.put(
  "/",
  requireRole("TEACHER"),

  lessonPlanController.updateLessonPlan.bind(lessonPlanController),
);

lessonPlanRouter.delete(
  "/",
  requireRole("TEACHER"),

  lessonPlanController.deleteLessonPlan.bind(lessonPlanController),
);

lessonPlanRouter.get(
  "/options",
  lessonPlanController.getLessonPlanOptions.bind(lessonPlanController),
);

lessonPlanRouter.get(
  "/student",
  lessonPlanController.getStudentLessonPlanWithMaterial.bind(
    lessonPlanController,
  ),
);

export default lessonPlanRouter;
