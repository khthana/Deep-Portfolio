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

export { createActivity, createSubmission } from "./activity";
export type { ActivityOptions, SubmissionOptions } from "./activity";
