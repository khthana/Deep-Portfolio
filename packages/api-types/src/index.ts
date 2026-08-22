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
 * (docs/adr/0038-a-factory-must-be-able-to-say-null.md), and then the weekly
 * plan itself, three of whose four shapes are the same row with something added
 * or nothing added and so are written as intersections over it
 * (docs/adr/0039-the-row-and-what-is-added-to-it.md), and then the first two
 * sections of the e-Portfolio — the student's personal details and their
 * schooling — which is where that feature turned out to be ten of them
 * (docs/adr/0040-the-portfolio-is-ten-features.md), and then the six sections
 * that hang files off themselves, which share one attachment shape between them
 * (docs/adr/0041-one-attachment-shape-for-six-sections.md), and then the skills
 * section, one of whose endpoints had never been named on either side
 * (docs/adr/0042-an-any-is-an-unnamed-shape.md), and then the cover page and
 * the aggregate read behind the share link, which finishes that feature and
 * imports the nine section files to do it
 * (docs/adr/0043-the-aggregate-imports-nine.md), and then who the caller is —
 * `/user` and the one `/auth` route that answers a shape, which the pass
 * before had already taken half of
 * (docs/adr/0044-a-response-is-what-was-selected.md), and then what a student
 * reads about their own studies — ten endpoints read by five web features,
 * which is one pass because they share one service
 * (docs/adr/0045-one-service-many-screens.md), and then the programme's shared
 * rubrics, the first pass to find both web copies already correct and so the
 * one that had to say what a pass still owes when there is nothing to fix
 * (docs/adr/0046-a-select-that-narrows-nothing.md), and last the two halves of
 * the screen that maps work onto a CLO, whose reads answered a whole activity
 * row to cards that draw five fields and two
 * (docs/adr/0047-narrow-to-the-card.md).
 *
 * docs/adr/0028-shared-api-types.md says why the package is shaped this way
 * and docs/adr/0029-api-types-per-feature.md what each pass after the first
 * had to do. #68 is finished: no file under the type-file glob ADR-0028 names
 * declares an API response any more — what is left there is request bodies,
 * form types, mock types, view models and the runtime label maps this package
 * cannot hold (ADR-0028 §4). Twenty response shapes are still written inline
 * in web service and thunk generics (`ResponseWrapper<{ id: number }>` and
 * friends), which were never in #68's count; ADR-0047's last note says where
 * they stand. The envelope they all arrive in is #67.
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
  ActivityCLOMapping,
  CLOMappedActivity,
  CLOMappedLearningActivity,
  LearningActivityCLOMapping,
} from "./clo-mapping";

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
  LessonPlanIdResp,
  LessonPlanRow,
  LessonPlanWeek,
  StudentLessonPlanWeek,
} from "./lesson-plan";

export type {
  LearningActivityDetailResp,
  LearningActivityListItem,
  LearningActivityType,
} from "./learning-activity";

export type {
  PortfolioDetail,
  PortfolioTemplateDetail,
  PublicPortfolioDetail,
  PublicPortfolioWork,
  PublicPortfolioWorkAttachment,
} from "./portfolio";

export type { PortfolioActivityDetail } from "./portfolio-activity";

export type { PortfolioSectionAttachment } from "./portfolio-attachment";

export type { PortfolioAwardDetail } from "./portfolio-award";

export type { PortfolioCertificateDetail } from "./portfolio-certificate";

export type { PortfolioEducationDetail } from "./portfolio-education";

export type { PortfolioInternshipDetail } from "./portfolio-internship";

export type {
  PortfolioPersonalDetail,
  PortfolioPersonalPicture,
  PortfolioPersonalRow,
} from "./portfolio-personal";

export type {
  PortfolioSkillDetail,
  PortfolioWorkDetail,
  SkillMapping,
  SkillMappingDetail,
} from "./portfolio-skill";

export type { PortfolioThesisDetail } from "./portfolio-thesis";

export type { PortfolioTrainingDetail } from "./portfolio-training";

export type {
  RubricDetail,
  RubricLevel,
  SharedRubric,
  SharedRubricCriterion,
} from "./rubric";

export type { ScoreWeightBrief, ScoreWeightDetail } from "./score-weight";

export type {
  AllClassworkDetailResp,
  CalendarClassworkEvent,
  CalendarCourseEvent,
  CalendarEventResp,
  ClassworkCategory,
  ClassworkDetail,
  ClassworkDetailResp,
  ClassworkStatus,
  ClassworkType,
  EnrolledSubject,
  SectionActivityOption,
  StudentDetail,
  StudentFullNameTh,
  StudentNameBrief,
  StudentRosterEntry,
  SubmissionWithCourse,
} from "./student";

export type { SessionUser, UserDetail } from "./user";

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
