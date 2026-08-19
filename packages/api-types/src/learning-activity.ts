import type { AttachmentDetailResp } from "./attachment";

/**
 * Classroom work — the other half of the assessment model, and a separate table
 * all the way down. A learning activity is not marked out of anything: no score
 * column, no rubric, no score category. A teacher records that a student did it
 * and writes them a comment.
 */

/**
 * `learning_activities.learning_activity_type` is a `VarChar(20)` with nothing
 * behind it, stored lower case and upper-cased on the way out. The only door in
 * is `classworkType`, a two-value enum declared in
 * apps/api/src/validation/activity.schema.ts and imported by
 * learning-activity.schema.ts, so this is what every row the system creates
 * holds.
 *
 * Spelled out here rather than borrowed from `ActivityType`: it is a different
 * column on a different table, guarded by its own schema, and one of the two
 * gaining a third value should not silently widen the other.
 */
export type LearningActivityType = "INDIVIDUAL" | "GROUP";

/**
 * One learning activity, in full. The service spreads the `learning_activities`
 * row and adds two things to it: `learning_activity_id` beside the row's own
 * `id`, and the attachments.
 *
 * No `week_no` here, unlike the list row — the lesson-plan lookup that would
 * fetch it is commented out in the service, so the key is absent rather than
 * null. Pinned by "answers with every key the row has, and dates as strings"
 * in apps/api/test/learning-activity.test.ts.
 */
export type LearningActivityDetailResp = {
  id: number;
  /** The same number as `id`. Both are sent. */
  learning_activity_id: number;
  learning_activity_type: LearningActivityType;
  learning_activity_name: string;
  announcement_date: string | null;
  deadline_date: string | null;
  course_syllabus_id: number | null;
  section_id: number;
  /** The column is `Json?` and the schema guarding the way in takes any JSON,
   *  so the API does not know the shape — each reader narrows it where it
   *  decides what it is looking at (ADR-0032 §4). */
  detail: unknown;
  created_at: string | null;
  updated_at: string | null;
  /** Never null: the service answers two lists whatever it finds. */
  attachments: AttachmentDetailResp;
};

/**
 * One row of the teacher's classroom-work list. Seven columns off the activity,
 * the week of the lesson plan it hangs on, and three counts over its
 * submissions.
 */
export type LearningActivityListItem = {
  id: number;
  learning_activity_name: string;
  learning_activity_type: LearningActivityType;
  announcement_date: string | null;
  deadline_date: string | null;
  section_id: number;
  course_syllabus_id: number | null;
  /**
   * Optional rather than nullable, and the difference is real: an activity on
   * no lesson plan leaves this `undefined`, which JSON drops, so the key is not
   * there at all.
   */
  week_no?: number;
  /** Never null — each is the length of an array the service just counted. */
  student_count: number;
  submitted_count: number;
  pending_grading_count: number;
};
