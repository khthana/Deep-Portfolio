import { Router } from "express";
import LessonPlanController from "../controllers/lesson-plan.controller";
import { requireRole } from "../middlewares/auth.middleware";
import { validate } from "../validation/validate";
import {
  addLessonPlanBody,
  deleteLessonPlanQuery,
  lessonPlanQuery,
  updateLessonPlanBody,
} from "../validation/lesson-plan.schema";

const lessonPlanRouter = Router();
const lessonPlanController = new LessonPlanController();

lessonPlanRouter.get(
  "/",
  validate({ query: lessonPlanQuery }),
  lessonPlanController.getLessonPlan.bind(lessonPlanController),
);

lessonPlanRouter.post(
  "/",
  requireRole("TEACHER"),
  validate({ body: addLessonPlanBody }),
  lessonPlanController.addLessonPlan.bind(lessonPlanController),
);

lessonPlanRouter.put(
  "/",
  requireRole("TEACHER"),
  validate({ body: updateLessonPlanBody }),
  lessonPlanController.updateLessonPlan.bind(lessonPlanController),
);

lessonPlanRouter.delete(
  "/",
  requireRole("TEACHER"),
  validate({ query: deleteLessonPlanQuery }),
  lessonPlanController.deleteLessonPlan.bind(lessonPlanController),
);

lessonPlanRouter.get(
  "/options",
  validate({ query: lessonPlanQuery }),
  lessonPlanController.getLessonPlanOptions.bind(lessonPlanController),
);

lessonPlanRouter.get(
  "/student",
  validate({ query: lessonPlanQuery }),
  lessonPlanController.getStudentLessonPlanWithMaterial.bind(
    lessonPlanController,
  ),
);

export default lessonPlanRouter;
