import type {
  SubmitActivityFields,
  SubmitLearningActivityFields,
} from "../validation/student.schema";

// ClassworkDetail, ClassworkCategory, ClassworkDetailResp,
// AllClassworkDetailResp, CalendarEventResp, CalendarClassworkEvent and
// CalendarCourseEvent used to be declared here. They moved to
// @deep-portfolio/api-types (#68) — import them from there. The dates are
// strings in that file, which is what res.json sends; the two `as` casts that
// built a calendar event are gone with them, and the drift they were hiding is
// in ADR-0045.

/**
 * The two values the classwork lists narrow `activity_type` to, as a value.
 *
 * The union itself is `ClassworkType` in @deep-portfolio/api-types (#68); this
 * is the object, which stays here because a runtime value cannot live in a
 * types-only package (ADR-0028 §4). `student-activity.controller.ts` reads
 * `ClassworkType.INDIVIDUAL` to pick which half of the grading pair to call.
 */
export const ClassworkType = {
  INDIVIDUAL: "INDIVIDUAL",
  GROUP: "GROUP",
} as const;

//---------------------------------------------------

/**
 * What the service is given: the validated form, plus the two things that do
 * not come out of it — the files multer took off the request, and the student
 * the session says is asking.
 */
export type SubmitActivityBody = SubmitActivityFields & {
  student_id: string;
  files: Express.Multer.File[];
};

export type SubmitLearningActivityBody = SubmitLearningActivityFields & {
  student_id: string;
  files: Express.Multer.File[];
};
