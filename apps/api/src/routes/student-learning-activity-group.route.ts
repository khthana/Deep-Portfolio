import { Router } from "express";
import StudentLearningActivityGroupController from "../controllers/student-learning-activity-group.controller";
import { requireRole } from "../middlewares/auth.middleware";

const studentLearningActivityGroupRouter = Router();
const studentLearningActivityGroupController =
  new StudentLearningActivityGroupController();

studentLearningActivityGroupRouter.patch(
  "/",
  requireRole("STUDENT"),
  studentLearningActivityGroupController.updateStudentLearningActivityGroup.bind(
    studentLearningActivityGroupController,
  ),
);

studentLearningActivityGroupRouter.post(
  "/",
  requireRole("STUDENT"),
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
