import { Router } from "express";
import StudentController from "../controllers/student.controller";
import upload from "../middlewares/upload-minio";
import { requireRole } from "../middlewares/auth.middleware";
import { validate } from "../validation/validate";
import {
  activityDetailsParams,
  enrolledSubjectsQuery,
  sectionActivitiesQuery,
  studentClassworkListQuery,
  studentListQuery,
  studentTermQuery,
  submitActivityBody,
  submitLearningActivityBody,
} from "../validation/student.schema";

const studentRouter = Router();
const studentController = new StudentController();

studentRouter.get(
  "/list",
  validate({ query: studentListQuery }),
  studentController.getStudentInSec.bind(studentController),
);

studentRouter.get(
  "/course/list",
  requireRole("STUDENT"),
  validate({ query: studentTermQuery }),
  studentController.getStudentCourseList.bind(studentController),
);

studentRouter.get(
  "/classwork/list",
  requireRole("STUDENT"),
  validate({ query: studentClassworkListQuery }),
  studentController.getStudentCourseClassworkList.bind(studentController),
);

studentRouter.get(
  "/calendar",
  requireRole("STUDENT"),
  validate({ query: studentTermQuery }),
  studentController.getStudentCalendarEvent.bind(studentController),
);

studentRouter.get(
  "/all/classwork/list",
  requireRole("STUDENT"),
  validate({ query: studentTermQuery }),
  studentController.getStudentAllClassworkList.bind(studentController),
);

// requireRole ahead of upload: multer reads the whole request body before it
// hands on, so registering it first means a caller who is about to be refused
// has already had their files buffered. validate goes after upload for the
// opposite reason — a multipart body does not exist until multer has parsed it.
studentRouter.post(
  "/submit/activity",
  requireRole("STUDENT"),
  upload.array("files"),
  validate({ body: submitActivityBody }),
  studentController.submitActivity.bind(studentController),
);

studentRouter.post(
  "/submit/learning-activity",
  requireRole("STUDENT"),
  upload.array("files"),
  validate({ body: submitLearningActivityBody }),
  studentController.submitLearningActivity.bind(studentController),
);

studentRouter.get(
  "/activities/details/:student_activity_id",
  validate({ params: activityDetailsParams }),
  studentController.getActivityDetails.bind(studentController),
);

studentRouter.get(
  "/enrolled/subjects",
  validate({ query: enrolledSubjectsQuery }),
  studentController.getEnrolledSubjects.bind(studentController),
);

studentRouter.get(
  "/activities/list",
  validate({ query: sectionActivitiesQuery }),
  studentController.getActivitiesBySectionId.bind(studentController),
);

export default studentRouter;
