import type { StudentActivityStatusDB } from "../types/activity-type.type";
import type { SubmissionStatus } from "../features/teacher/activity/types/activity-type.type";

/**
 * Which chip a row of the marking table wears.
 *
 * The API has four statuses and the table has three, because `SUBMITTED` and
 * `GRADING` are the same thing to a teacher looking for what to do next: work is
 * in and nobody has finished marking it.
 *
 * `NOT_SUBMITTED` is the one that is new. Both roster endpoints used to drop
 * those rows before answering, so every row that arrived had something in it and
 * "not marked yet" was a safe reading of anything that was not `GRADED`. Since
 * #56 the rows are here, and calling them ยังไม่ตรวจ would tell the teacher there
 * is work waiting when there is none.
 *
 * Both marking tables share this for the reason they share
 * format-marked-students: the same row means the same thing on both screens.
 */
export function formatSubmissionStatus(
  status: StudentActivityStatusDB,
): SubmissionStatus {
  if (status === "GRADED") return "GRADED";
  if (status === "NOT_SUBMITTED") return "NOT_SUBMITTED";

  return "PENDING";
}
