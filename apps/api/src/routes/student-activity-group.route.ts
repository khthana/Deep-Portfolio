import { Router } from "express";
import StudentActivityGroupController from "../controllers/student-activity-group.controller";
import { verifyStudent } from "../middlewares/auth.middleware";

const studentActivityGroupRouter = Router();
const studentActivityGroupController = new StudentActivityGroupController();

studentActivityGroupRouter.patch(
  "/",
  verifyStudent,
  studentActivityGroupController.updateStudentActivityGroup.bind(
    studentActivityGroupController,
  ),
);

studentActivityGroupRouter.post(
  "/",
  verifyStudent,
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
