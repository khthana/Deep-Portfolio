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
 * them (docs/adr/0032-activity-follows-the-row.md), then the classroom-work
 * half of the same screen
 * (docs/adr/0033-learning-activity-and-the-absent-key.md), and then what the
 * students hand in against both — the two submission features, moved together
 * because they share the group a roster reports
 * (docs/adr/0034-submissions-move-as-a-pair.md) — and then the group half of
 * those same two, whose six reads answer the same shape field for field and so
 * got one declaration between them
 * (docs/adr/0035-one-group-shape-for-both-halves.md), and then the score
 * categories, which added nothing here at all because the activity pass had
 * already written the row (docs/adr/0036-a-bare-scalar-gets-no-name.md), and
 * then the noticeboard
 * (docs/adr/0037-the-package-says-what-the-wire-says.md), and then the material
 * hung off a section's weekly plan
 * (docs/adr/0038-a-factory-must-be-able-to-say-null.md).
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

export type {
  AnnouncementDetailResp,
  AnnouncementIdResp,
  AnnouncementStatus,
} from "./announcement";

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
  CourseMaterialDetail,
  CourseMaterialWeek,
} from "./course-material";

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

export type {
  GroupDetailResp,
  GroupIdResp,
  GroupMemberDetail,
  GroupRole,
  MemberStatus,
  StudentWithoutGroup,
  SubmissionGroup,
  UnacceptedGroupMember,
  ValidateInviteResp,
} from "./group";

export type {
  LearningActivityDetailResp,
  LearningActivityListItem,
  LearningActivityType,
} from "./learning-activity";

export type { RubricDetail, RubricLevel } from "./rubric";

export type { ScoreWeightBrief, ScoreWeightDetail } from "./score-weight";

export type { StudentFullNameTh, StudentNameBrief } from "./student";

export type {
  ActivityGroupSubmission,
  ActivityIndividualSubmission,
  ActivitySubmission,
  ActivitySubmissionListResp,
  GradeStudentActivityResp,
  StudentActivityDetailResp,
  StudentActivityRubricScore,
  StudentActivityStatusDB,
} from "./student-activity";

export type {
  LearningActivityGroupSubmission,
  LearningActivityIndividualSubmission,
  LearningActivitySubmission,
  LearningActivitySubmissionListResp,
  StudentLearningActivityDetailResp,
} from "./student-learning-activity";
