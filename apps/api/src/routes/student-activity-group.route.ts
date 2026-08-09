import { Router } from "express";
import StudentActivityGroupController from "../controllers/student-activity-group.controller";
import { requireRole } from "../middlewares/auth.middleware";
import { validate } from "../validation/validate";
import {
  createStudentActivityGroupBody,
  studentActivityGroupInSecQuery,
  studentActivityGroupQuery,
  studentsWithoutGroupQuery,
  updateStudentActivityGroupBody,
} from "../validation/student-activity-group.schema";

const studentActivityGroupRouter = Router();
const studentActivityGroupController = new StudentActivityGroupController();

studentActivityGroupRouter.patch(
  "/",
  requireRole("STUDENT"),
  validate({ body: updateStudentActivityGroupBody }),
  studentActivityGroupController.updateStudentActivityGroup.bind(
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

studentActivityGroupRouter.get(
  "/",
  validate({ query: studentActivityGroupQuery }),
  studentActivityGroupController.getStudentActivityGroup.bind(
    studentActivityGroupController,
  ),
);

studentActivityGroupRouter.get(
  "/all",
  validate({ query: studentActivityGroupInSecQuery }),
  studentActivityGroupController.getStudentActivityGroupInSec.bind(
    studentActivityGroupController,
  ),
);

studentActivityGroupRouter.get(
  "/without-group",
  validate({ query: studentsWithoutGroupQuery }),
  studentActivityGroupController.getStudentWithoutGroup.bind(
    studentActivityGroupController,
  ),
);

export default studentActivityGroupRouter;
