import { Router } from "express";
import StudentLearningActivityGroupController from "../controllers/student-learning-activity-group.controller";
import { requireRole } from "../middlewares/auth.middleware";
import { requireEnrolledSection } from "../middlewares/owner.middleware";
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

// The two reads that are about a student are about the one who is signed in,
// so they need nothing but the session to know whose answer to give (#26).
studentLearningActivityGroupRouter.get(
  "/",
  requireRole("STUDENT"),
  validate({ query: studentLearningActivityGroupQuery }),
  studentLearningActivityGroupController.getStudentLearningActivityGroup.bind(
    studentLearningActivityGroupController,
  ),
);

studentLearningActivityGroupRouter.get(
  "/all",
  requireRole("STUDENT"),
  validate({ query: studentLearningActivityGroupInSecQuery }),
  studentLearningActivityGroupController.getStudentLearningActivityGroupInSec.bind(
    studentLearningActivityGroupController,
  ),
);

// This one is about a section — the classmates still without a group — so the
// session alone does not narrow it, and enrolment is the check instead. After
// validate, so a request that names no section is a 400 rather than a 403.
studentLearningActivityGroupRouter.get(
  "/without-group",
  requireRole("STUDENT"),
  validate({ query: studentsWithoutLearningGroupQuery }),
  requireEnrolledSection("query"),
  studentLearningActivityGroupController.getStudentWithoutGroup.bind(
    studentLearningActivityGroupController,
  ),
);

export default studentLearningActivityGroupRouter;
