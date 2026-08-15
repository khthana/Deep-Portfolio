/**
 * The shapes apps/api answers in, imported by both sides.
 *
 * Written by hand against what the endpoints already do, and read as JSON
 * reads them: a date is a string here, because that is what a caller parses,
 * even where the API holds a Date and Prisma holds a timestamp. Request bodies
 * are not here — they belong to the zod schemas in apps/api/src/validation,
 * which are what actually refuses a bad one.
 *
 * The course feature moved first and the gradebook followed;
 * docs/adr/0028-shared-api-types.md says why the package is shaped this way
 * and docs/adr/0029-api-types-per-feature.md what each pass after the first
 * has to do. The rest are still written twice, one feature at a time (#68).
 */
export type {
  ApiError,
  ApiResponse,
  FieldError,
  FieldLocation,
} from "./envelope";

export type {
  CLOResp,
  CourseDetail,
  CourseDetailBrief,
  LearningOutcomeType,
  PLOResp,
  TeacherCourseListResp,
  Weekday,
} from "./course";

export type {
  GradebookActivity,
  GradebookPerActivityResp,
  GradebookPerStudentResp,
  GradebookStudent,
  GradebookStudentActivity,
} from "./gradebook";

export type { StudentActivityStatusDB } from "./student-activity";
