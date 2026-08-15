/**
 * What a student's submission is worth saying about itself.
 *
 * Only the status has moved here so far, because the gradebook sends it and
 * the gradebook is the feature this pass carried. The rest of the submission
 * shapes are still written twice — once in apps/api/src/models and once under
 * apps/web/src — and follow when their own pass comes (#68). This file is
 * where they land, not gradebook.ts.
 */

/**
 * The four values `student_activity.status` holds, which is what every
 * endpoint that reports a submission sends.
 *
 * The `DB` suffix is not decoration: apps/api also has a `StudentActivityStatus`
 * of its own with `LATE` in place of `GRADING`, which is a reading of the
 * dates rather than a column, and only one of the two is on the wire. Whether
 * the derived one belongs here too is a question for the pass that moves the
 * student-activity feature.
 */
export type StudentActivityStatusDB =
  "NOT_SUBMITTED" | "SUBMITTED" | "GRADING" | "GRADED";
