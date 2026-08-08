import { Router } from "express";
import StudentLearningActivityController from "../controllers/student-learning-activity.controller";
import { requireRole } from "../middlewares/auth.middleware";

const studentLearningActivityRouter = Router();
const studentLearningActivityController =
  new StudentLearningActivityController();

studentLearningActivityRouter.post(
  "/grade",
  requireRole("TEACHER"),

  studentLearningActivityController.gradeStudentActivity.bind(
    studentLearningActivityController,
  ),
);

studentLearningActivityRouter.patch(
  "/bookmark",
  requireRole("TEACHER"),

  studentLearningActivityController.addStudentLearningActivityToBookmark.bind(
    studentLearningActivityController,
  ),
);

export default studentLearningActivityRouter;
