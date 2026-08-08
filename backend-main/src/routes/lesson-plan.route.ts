import { Router } from "express";
import CourseController from "../controllers/course.controller";
import LessonPlanController from "../controllers/lesson-plan.controller";
import { verifyTeacher } from "../middlewares/auth.middleware";

const lessonPlanRouter = Router();
const lessonPlanController = new LessonPlanController();

lessonPlanRouter.get(
  "/",
  lessonPlanController.getLessonPlan.bind(lessonPlanController),
);

lessonPlanRouter.post(
  "/",
  verifyTeacher,

  lessonPlanController.addLessonPlan.bind(lessonPlanController),
);

lessonPlanRouter.put(
  "/",
  verifyTeacher,

  lessonPlanController.updateLessonPlan.bind(lessonPlanController),
);

lessonPlanRouter.delete(
  "/",
  verifyTeacher,

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
