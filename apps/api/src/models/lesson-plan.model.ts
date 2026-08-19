/** Stated once, by the schemas that check it. */
export type {
  AddLessonPlanBody,
  UpdateLessonPlanBody,
} from "../validation/lesson-plan.schema";

// GetStudentLessonPlanWithMaterialResp used to be declared here. It moved to
// @deep-portfolio/api-types (#68) as `StudentLessonPlanWeek`, beside the three
// other shapes this feature answers — import them from there. What it said that
// the endpoint does not: the two dates are strings on the wire, not `Date`. See
// ADR-0039.
