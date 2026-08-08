import { Router } from "express";
import StudentController from "../controllers/student.controller";
import upload from "../middlewares/upload-minio";
import { verifyStudent } from "../middlewares/auth.middleware";

const studentRouter = Router();
const studentController = new StudentController();

studentRouter.get(
  "/list",
  studentController.getStudentInSec.bind(studentController),
);

studentRouter.get(
  "/course/list",
  verifyStudent,
  studentController.getStudentCourseList.bind(studentController),
);

studentRouter.get(
  "/classwork/list",
  verifyStudent,
  studentController.getStudentCourseClassworkList.bind(studentController),
);

studentRouter.get(
  "/calendar",
  verifyStudent,
  studentController.getStudentCalendarEvent.bind(studentController),
);

studentRouter.get(
  "/all/classwork/list",
  verifyStudent,
  studentController.getStudentAllClassworkList.bind(studentController),
);

studentRouter.post(
  "/submit/activity",
  upload.array("files"),
  verifyStudent,
  studentController.submitActivity.bind(studentController),
);

studentRouter.post(
  "/submit/learning-activity",
  upload.array("files"),
  verifyStudent,
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
