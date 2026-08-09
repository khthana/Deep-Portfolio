import { z } from "zod";
import { classworkType } from "./activity.schema";
import {
  blankableText,
  bool,
  decimal,
  id,
  positiveInteger,
  userId,
} from "./fields";

/** `/student-activity` — marking one submission, and what was handed in with it. */

/**
 * One criterion of the activity's rubric and the level it was marked at.
 *
 * `rubric_level_no` is what the score is worked out from — the level over the
 * total — so it is the number that matters here, not `rubric_level_id`, which
 * is only recorded so re-opening the marking shows the same box ticked.
 */
const rubricMark = z.object({
  rubric_id: id,
  rubric_level_id: id,
  rubric_level_no: positiveInteger,
});

/**
 * `total_level` may not be zero: the score is the level divided by it. An empty
 * `rubric_detail` is allowed, and means the submission is marked at nothing —
 * that is what a teacher who saves feedback without touching the rubric sends.
 */
export const gradeStudentActivityBody = z.object({
  activity_id: id,
  student_id: userId,
  activity_type: classworkType,
  student_activity_id: id,
  full_score: decimal,
  total_level: positiveInteger,
  rubric_detail: z.array(rubricMark),

  feedback: blankableText.optional(),
  remark: blankableText.optional(),
});

export const bookmarkStudentActivityBody = z.object({
  activity_type: classworkType,
  student_activity_id: id,
  is_bookmark: bool,
});

export const studentActivityAttachmentsQuery = z.object({
  student_activity_id: id,
});

export type GradeStudentActivityBody = z.infer<typeof gradeStudentActivityBody>;
export type BookmarkStudentActivityBody = z.infer<
  typeof bookmarkStudentActivityBody
>;
