import { Router } from "express";
import StudentController from "../controllers/student.controller";
import upload from "../middlewares/upload-minio";
import { requireRole } from "../middlewares/auth.middleware";

const studentRouter = Router();
const studentController = new StudentController();

studentRouter.get(
  "/list",
  studentController.getStudentInSec.bind(studentController),
);

studentRouter.get(
  "/course/list",
  requireRole("STUDENT"),
  studentController.getStudentCourseList.bind(studentController),
);

studentRouter.get(
  "/classwork/list",
  requireRole("STUDENT"),
  studentController.getStudentCourseClassworkList.bind(studentController),
);

studentRouter.get(
  "/calendar",
  requireRole("STUDENT"),
  studentController.getStudentCalendarEvent.bind(studentController),
);

studentRouter.get(
  "/all/classwork/list",
  requireRole("STUDENT"),
  studentController.getStudentAllClassworkList.bind(studentController),
);

// requireRole ahead of upload: multer reads the whole request body before it
// hands on, so registering it first means a caller who is about to be refused
// has already had their files buffered.
studentRouter.post(
  "/submit/activity",
  requireRole("STUDENT"),
  upload.array("files"),
  studentController.submitActivity.bind(studentController),
);

studentRouter.post(
  "/submit/learning-activity",
  requireRole("STUDENT"),
  upload.array("files"),
  studentController.submitLearningActivity.bind(studentController),
);

studentRouter.get(
  "/activities/details/:student_activity_id",
  studentController.getActivityDetails.bind(studentController),
);

studentRouter.get(
  "/enrolled/subjects",
  studentController.getEnrolledSubjects.bind(studentController),
);

studentRouter.get(
  "/activities/list",
  studentController.getActivitiesBySectionId.bind(studentController),
);

export default studentRouter;
