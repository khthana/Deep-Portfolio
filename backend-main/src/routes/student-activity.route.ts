import { Router } from "express";
import CourseController from "../controllers/course.controller";
import StudentActivityController from "../controllers/student-activity.controller";
import { verifyTeacher } from "../middlewares/auth.middleware";

const studentActivityRouter = Router();
const studentActivityController = new StudentActivityController();

studentActivityRouter.post(
  "/grade",
  verifyTeacher,

  studentActivityController.gradeStudentActivity.bind(
    studentActivityController,
  ),
);

studentActivityRouter.patch(
  "/bookmark",
  verifyTeacher,

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
