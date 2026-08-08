/**
 * One import for the whole set:
 *
 *     import { createTeacher, createCourse } from "./factories";
 *
 * The rule these follow, and that anything added here should follow: a factory
 * takes only what the case is about and invents the rest, and it creates its
 * own parents so a case never has to build a chain it does not care about. It
 * does not, however, hide anything the case *is* about — if a value shows up in
 * an assertion, it should have shown up in the arrange step too.
 */

export { createUser, createTeacher, createStudent } from "./user";
export type { UserOptions, StudentOptions } from "./user";

export { createCourse, setCourseSchedule, enrolStudent } from "./course";
export type { CourseOptions, CreatedCourse, ScheduleOptions } from "./course";

export {
  createActivity,
  createLearningActivity,
  createSubmission,
  createLearningSubmission,
} from "./activity";
export type {
  ActivityOptions,
  LearningActivityOptions,
  SubmissionOptions,
  LearningSubmissionOptions,
} from "./activity";

export {
  createSharedRubric,
  createSharedRubricDetail,
  createActivityRubric,
} from "./rubric";
export type {
  SharedRubricOptions,
  SharedRubricDetailOptions,
  ActivityRubricOptions,
  ActivityRubricLevel,
} from "./rubric";

export { mapActivityToCLO, mapLearningActivityToCLO } from "./mapping";
export type {
  ActivityCLOMappingOptions,
  LearningActivityCLOMappingOptions,
} from "./mapping";

export { createPLO, createCLO } from "./outcome";
export type { PLOOptions, CLOOptions } from "./outcome";

export { createScoreWeight } from "./score-weight";
export type { ScoreWeightOptions } from "./score-weight";

export { createLessonPlan, createCourseMaterial } from "./syllabus";
export type { LessonPlanOptions, CourseMaterialOptions } from "./syllabus";

export { createFileAttachment, createLinkAttachment } from "./attachment";
export type {
  FileAttachmentOptions,
  LinkAttachmentOptions,
} from "./attachment";

export { createAnnouncement } from "./announcement";
export type { AnnouncementOptions } from "./announcement";
