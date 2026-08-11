import { Router } from "express";
import StudentController from "../controllers/student.controller";
import upload from "../middlewares/upload-minio";
import { requireRole } from "../middlewares/auth.middleware";
import {
  entryOwner,
  requireEnrolledSection,
  requireOwnEntry,
  requireOwnSection,
} from "../middlewares/owner.middleware";
import { validate } from "../validation/validate";
import {
  activityDetailsParams,
  sectionActivitiesQuery,
  studentClassworkListQuery,
  studentListQuery,
  studentTermQuery,
  submitActivityBody,
  submitLearningActivityBody,
} from "../validation/student.schema";

const studentRouter = Router();
const studentController = new StudentController();

// The roster of a class, which is the teacher's view of it: the only screen
// that asks is the teacher's, and ADR-0002 says a teacher's reach is the
// sections they teach. It used to have no middleware at all, so a section id
// was the whole of what stood between a stranger and every student's name and
// id in that class (#41).
studentRouter.get(
  "/list",
  requireRole("TEACHER"),
  validate({ query: studentListQuery }),
  requireOwnSection("query"),
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

// A submission is the student's own work, so the rule is the portfolio's:
// whoever the row belongs to (#41). The teacher's side reads a submission
// through /student-activity, not through here.
studentRouter.get(
  "/activities/details/:student_activity_id",
  requireRole("STUDENT"),
  validate({ params: activityDetailsParams }),
  requireOwnEntry(entryOwner.studentActivity, "student_activity_id"),
  studentController.getActivityDetails.bind(studentController),
);

// The student comes from the session, like every other "about me" read in this
// router. It used to come from the query with nothing guarding it, so a
// classmate's whole timetable was one parameter away (#40).
studentRouter.get(
  "/enrolled/subjects",
  requireRole("STUDENT"),
  studentController.getEnrolledSubjects.bind(studentController),
);

// "The work in this section, with my own answers beside it." The student used
// to come from the query, so a classmate's every score and every piece of
// feedback was one parameter away — the same defect #40 closed on
// /enrolled/subjects, closed the same way (#41). Being in the class is what
// makes the section half of the question the caller's own.
studentRouter.get(
  "/activities/list",
  requireRole("STUDENT"),
  validate({ query: sectionActivitiesQuery }),
  requireEnrolledSection("query"),
  studentController.getActivitiesBySectionId.bind(studentController),
);

export default studentRouter;
