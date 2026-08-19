/**
 * The shapes apps/api answers in, imported by both sides.
 *
 * Written by hand against what the endpoints already do, and read as JSON
 * reads them: a date is a string here, because that is what a caller parses,
 * even where the API holds a Date and Prisma holds a timestamp. Request bodies
 * are not here — they belong to the zod schemas in apps/api/src/validation,
 * which are what actually refuses a bad one.
 *
 * The course feature moved first, then the gradebook, then the student's
 * evaluation list, then attachments — which is not a feature of its own but
 * the shape six of them embed, and was moved ahead of all six on purpose
 * (docs/adr/0031-attachments-are-the-leaf.md) — and then the teacher's
 * assessment endpoints, which brought the rubric and the score category with
 * them (docs/adr/0032-activity-follows-the-row.md).
 *
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
  ActivityDetailResp,
  ActivityListItem,
  ActivityType,
} from "./activity";

export type { AttachmentDetailResp, FileDetail, URLDetail } from "./attachment";

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
  StudentEvaluationActivityRow,
  StudentEvaluationLearningActivityRow,
  StudentEvaluationListResp,
  StudentEvaluationRow,
} from "./evaluation";

export type {
  GradebookActivity,
  GradebookPerActivityResp,
  GradebookPerStudentResp,
  GradebookStudent,
  GradebookStudentActivity,
} from "./gradebook";

export type { RubricDetail, RubricLevel } from "./rubric";

export type { ScoreWeightBrief, ScoreWeightDetail } from "./score-weight";

export type { StudentActivityStatusDB } from "./student-activity";
