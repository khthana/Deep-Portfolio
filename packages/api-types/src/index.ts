/**
 * The shapes apps/api answers in, imported by both sides.
 *
 * Written by hand against what the endpoints already do, and read as JSON
 * reads them: a date is a string here, because that is what a caller parses,
 * even where the API holds a Date and Prisma holds a timestamp. Request bodies
 * are not here — they belong to the zod schemas in apps/api/src/validation,
 * which are what actually refuses a bad one.
 *
 * Only the course feature has moved so far. docs/adr/0028-shared-api-types.md
 * says why, and what has to be true before the next one follows.
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
