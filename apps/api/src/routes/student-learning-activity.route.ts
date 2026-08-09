import { Router } from "express";
import StudentLearningActivityController from "../controllers/student-learning-activity.controller";
import { requireRole } from "../middlewares/auth.middleware";
import { validate } from "../validation/validate";
import {
  bookmarkStudentLearningActivityBody,
  gradeStudentLearningActivityBody,
} from "../validation/student-learning-activity.schema";

const studentLearningActivityRouter = Router();
const studentLearningActivityController =
  new StudentLearningActivityController();

studentLearningActivityRouter.post(
  "/grade",
  requireRole("TEACHER"),
  validate({ body: gradeStudentLearningActivityBody }),
  studentLearningActivityController.gradeStudentActivity.bind(
    studentLearningActivityController,
  ),
);

studentLearningActivityRouter.patch(
  "/bookmark",
  requireRole("TEACHER"),
  validate({ body: bookmarkStudentLearningActivityBody }),
  studentLearningActivityController.addStudentLearningActivityToBookmark.bind(
    studentLearningActivityController,
  ),
);

export default studentLearningActivityRouter;
