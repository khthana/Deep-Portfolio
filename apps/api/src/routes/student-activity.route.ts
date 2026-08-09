import { Router } from "express";
import StudentActivityController from "../controllers/student-activity.controller";
import { requireRole } from "../middlewares/auth.middleware";
import { validate } from "../validation/validate";
import {
  bookmarkStudentActivityBody,
  gradeStudentActivityBody,
  studentActivityAttachmentsQuery,
} from "../validation/student-activity.schema";

const studentActivityRouter = Router();
const studentActivityController = new StudentActivityController();

studentActivityRouter.post(
  "/grade",
  requireRole("TEACHER"),
  validate({ body: gradeStudentActivityBody }),
  studentActivityController.gradeStudentActivity.bind(
    studentActivityController,
  ),
);

studentActivityRouter.patch(
  "/bookmark",
  requireRole("TEACHER"),
  validate({ body: bookmarkStudentActivityBody }),
  studentActivityController.addStudentActivityToBookmark.bind(
    studentActivityController,
  ),
);

studentActivityRouter.get(
  "/attachments",
  validate({ query: studentActivityAttachmentsQuery }),
  studentActivityController.getStudentActivityAttachments.bind(
    studentActivityController,
  ),
);

export default studentActivityRouter;
