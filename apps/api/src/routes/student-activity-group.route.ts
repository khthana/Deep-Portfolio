import { Router } from "express";
import StudentActivityGroupController from "../controllers/student-activity-group.controller";
import { requireRole } from "../middlewares/auth.middleware";

const studentActivityGroupRouter = Router();
const studentActivityGroupController = new StudentActivityGroupController();

studentActivityGroupRouter.patch(
  "/",
  requireRole("STUDENT"),
  studentActivityGroupController.updateStudentActivityGroup.bind(
    studentActivityGroupController,
  ),
);

studentActivityGroupRouter.post(
  "/",
  requireRole("STUDENT"),
  studentActivityGroupController.createStudentActivityGroup.bind(
    studentActivityGroupController,
  ),
);

studentActivityGroupRouter.get(
  "/",
  studentActivityGroupController.getStudentActivityGroup.bind(
    studentActivityGroupController,
  ),
);

studentActivityGroupRouter.get(
  "/all",
  studentActivityGroupController.getStudentActivityGroupInSec.bind(
    studentActivityGroupController,
  ),
);

studentActivityGroupRouter.get(
  "/without-group",
  studentActivityGroupController.getStudentWithoutGroup.bind(
    studentActivityGroupController,
  ),
);

export default studentActivityGroupRouter;
