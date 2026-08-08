import { Router } from "express";
import CourseController from "../controllers/course.controller";
import StudentActivityController from "../controllers/student-activity.controller";
import { requireRole } from "../middlewares/auth.middleware";

const studentActivityRouter = Router();
const studentActivityController = new StudentActivityController();

studentActivityRouter.post(
  "/grade",
  requireRole("TEACHER"),

  studentActivityController.gradeStudentActivity.bind(
    studentActivityController,
  ),
);

studentActivityRouter.patch(
  "/bookmark",
  requireRole("TEACHER"),

  studentActivityController.addStudentActivityToBookmark.bind(
    studentActivityController,
  ),
);

studentActivityRouter.get(
  "/attachments",
  studentActivityController.getStudentActivityAttachments.bind(
    studentActivityController,
  ),
);

export default studentActivityRouter;
