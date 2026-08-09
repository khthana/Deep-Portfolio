import { Router } from "express";
import StudentLearningActivityGroupController from "../controllers/student-learning-activity-group.controller";
import { requireRole } from "../middlewares/auth.middleware";
import { validate } from "../validation/validate";
import {
  createStudentLearningActivityGroupBody,
  studentLearningActivityGroupInSecQuery,
  studentLearningActivityGroupQuery,
  studentsWithoutLearningGroupQuery,
  updateStudentLearningActivityGroupBody,
} from "../validation/student-learning-activity-group.schema";

const studentLearningActivityGroupRouter = Router();
const studentLearningActivityGroupController =
  new StudentLearningActivityGroupController();

studentLearningActivityGroupRouter.patch(
  "/",
  requireRole("STUDENT"),
  validate({ body: updateStudentLearningActivityGroupBody }),
  studentLearningActivityGroupController.updateStudentLearningActivityGroup.bind(
    studentLearningActivityGroupController,
  ),
);

studentLearningActivityGroupRouter.post(
  "/",
  requireRole("STUDENT"),
  validate({ body: createStudentLearningActivityGroupBody }),
  studentLearningActivityGroupController.createStudentLearningActivityGroup.bind(
    studentLearningActivityGroupController,
  ),
);

studentLearningActivityGroupRouter.get(
  "/",
  validate({ query: studentLearningActivityGroupQuery }),
  studentLearningActivityGroupController.getStudentLearningActivityGroup.bind(
    studentLearningActivityGroupController,
  ),
);

studentLearningActivityGroupRouter.get(
  "/all",
  validate({ query: studentLearningActivityGroupInSecQuery }),
  studentLearningActivityGroupController.getStudentLearningActivityGroupInSec.bind(
    studentLearningActivityGroupController,
  ),
);

studentLearningActivityGroupRouter.get(
  "/without-group",
  validate({ query: studentsWithoutLearningGroupQuery }),
  studentLearningActivityGroupController.getStudentWithoutGroup.bind(
    studentLearningActivityGroupController,
  ),
);

export default studentLearningActivityGroupRouter;
