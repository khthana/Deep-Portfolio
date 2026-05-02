import { Router } from "express";
import StudentLearningActivityController from "../controllers/student-learning-activity.controller";
import { verifyTeacher } from "../middlewares/auth.middleware";

const studentLearningActivityRouter = Router();
const studentLearningActivityController =
  new StudentLearningActivityController();

studentLearningActivityRouter.post(
  "/grade",
  verifyTeacher,

  studentLearningActivityController.gradeStudentActivity.bind(
    studentLearningActivityController,
  ),
);

studentLearningActivityRouter.patch(
  "/bookmark",
  verifyTeacher,

  studentLearningActivityController.addStudentLearningActivityToBookmark.bind(
    studentLearningActivityController,
  ),
);

export default studentLearningActivityRouter;
