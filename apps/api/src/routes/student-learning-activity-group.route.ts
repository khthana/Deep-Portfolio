import { Router } from "express";
import StudentLearningActivityGroupController from "../controllers/student-learning-activity-group.controller";
import { verifyStudent } from "../middlewares/auth.middleware";

const studentLearningActivityGroupRouter = Router();
const studentLearningActivityGroupController =
  new StudentLearningActivityGroupController();

studentLearningActivityGroupRouter.patch(
  "/",
  verifyStudent,
  studentLearningActivityGroupController.updateStudentLearningActivityGroup.bind(
    studentLearningActivityGroupController,
  ),
);

studentLearningActivityGroupRouter.post(
  "/",
  verifyStudent,
  studentLearningActivityGroupController.createStudentLearningActivityGroup.bind(
    studentLearningActivityGroupController,
  ),
);

studentLearningActivityGroupRouter.get(
  "/",
  studentLearningActivityGroupController.getStudentLearningActivityGroup.bind(
    studentLearningActivityGroupController,
  ),
);

studentLearningActivityGroupRouter.get(
  "/all",
  studentLearningActivityGroupController.getStudentLearningActivityGroupInSec.bind(
    studentLearningActivityGroupController,
  ),
);

studentLearningActivityGroupRouter.get(
  "/without-group",
  studentLearningActivityGroupController.getStudentWithoutGroup.bind(
    studentLearningActivityGroupController,
  ),
);

export default studentLearningActivityGroupRouter;
