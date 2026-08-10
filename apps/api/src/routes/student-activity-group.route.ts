import { Router } from "express";
import StudentActivityGroupController from "../controllers/student-activity-group.controller";
import { requireRole } from "../middlewares/auth.middleware";
import {
  groupLeader,
  requireEnrolledSection,
  requireGroupLeader,
} from "../middlewares/owner.middleware";
import { validate } from "../validation/validate";
import {
  createStudentActivityGroupBody,
  groupParams,
  studentActivityGroupInSecQuery,
  studentActivityGroupQuery,
  studentsWithoutGroupQuery,
  updateStudentActivityGroupBody,
} from "../validation/student-activity-group.schema";

const studentActivityGroupRouter = Router();
const studentActivityGroupController = new StudentActivityGroupController();

// The two writes rewrite the whole membership, so both are the leader's to make
// and nobody else's (#27). After validate, so a body that names no group is a
// 400 rather than a 403.
studentActivityGroupRouter.patch(
  "/",
  requireRole("STUDENT"),
  validate({ body: updateStudentActivityGroupBody }),
  requireGroupLeader(groupLeader.activity, "body"),
  studentActivityGroupController.updateStudentActivityGroup.bind(
    studentActivityGroupController,
  ),
);

studentActivityGroupRouter.delete(
  "/:group_id",
  requireRole("STUDENT"),
  validate({ params: groupParams }),
  requireGroupLeader(groupLeader.activity, "params"),
  studentActivityGroupController.deleteStudentActivityGroup.bind(
    studentActivityGroupController,
  ),
);

studentActivityGroupRouter.post(
  "/",
  requireRole("STUDENT"),
  validate({ body: createStudentActivityGroupBody }),
  studentActivityGroupController.createStudentActivityGroup.bind(
    studentActivityGroupController,
  ),
);

// The two reads that are about a student are about the one who is signed in,
// so they need nothing but the session to know whose answer to give (#26).
studentActivityGroupRouter.get(
  "/",
  requireRole("STUDENT"),
  validate({ query: studentActivityGroupQuery }),
  studentActivityGroupController.getStudentActivityGroup.bind(
    studentActivityGroupController,
  ),
);

studentActivityGroupRouter.get(
  "/all",
  requireRole("STUDENT"),
  validate({ query: studentActivityGroupInSecQuery }),
  studentActivityGroupController.getStudentActivityGroupInSec.bind(
    studentActivityGroupController,
  ),
);

// This one is about a section — the classmates still without a group — so the
// session alone does not narrow it, and enrolment is the check instead. After
// validate, so a request that names no section is a 400 rather than a 403.
studentActivityGroupRouter.get(
  "/without-group",
  requireRole("STUDENT"),
  validate({ query: studentsWithoutGroupQuery }),
  requireEnrolledSection("query"),
  studentActivityGroupController.getStudentWithoutGroup.bind(
    studentActivityGroupController,
  ),
);

export default studentActivityGroupRouter;
