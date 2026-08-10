import { Router } from "express";
import StudentLearningActivityGroupController from "../controllers/student-learning-activity-group.controller";
import { requireRole } from "../middlewares/auth.middleware";
import {
  groupLeader,
  requireEnrolledSection,
  requireGroupLeader,
} from "../middlewares/owner.middleware";
import { validate } from "../validation/validate";
import { groupParams } from "../validation/student-activity-group.schema";
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

// The two writes rewrite the whole membership, so both are the leader's to make
// and nobody else's (#27). After validate, so a body that names no group is a
// 400 rather than a 403.
studentLearningActivityGroupRouter.patch(
  "/",
  requireRole("STUDENT"),
  validate({ body: updateStudentLearningActivityGroupBody }),
  requireGroupLeader(groupLeader.learningActivity, "body"),
  studentLearningActivityGroupController.updateStudentLearningActivityGroup.bind(
    studentLearningActivityGroupController,
  ),
);

studentLearningActivityGroupRouter.delete(
  "/:group_id",
  requireRole("STUDENT"),
  validate({ params: groupParams }),
  requireGroupLeader(groupLeader.learningActivity, "params"),
  studentLearningActivityGroupController.deleteStudentLearningActivityGroup.bind(
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
