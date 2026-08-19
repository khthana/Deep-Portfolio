/**
 * What the teacher's assessment endpoints answer — GET /activity and
 * GET /activity/list.
 *
 * Both were written with an `as` cast over a spread Prisma row, which told the
 * compiler the body was whatever the old type said while the row decided what
 * it actually was. #68 removed both casts and wrote these against the two
 * cases in apps/api/test/activity.test.ts that name every key — see
 * docs/adr/0032-activity-follows-the-row.md for what the casts had been
 * hiding, which was drift in both directions.
 */
import type { AttachmentDetailResp } from "./attachment";
import type { RubricDetail } from "./rubric";
import type { ScoreWeightBrief, ScoreWeightDetail } from "./score-weight";

/**
 * `activities.activity_type` is a `VarChar(20)` with nothing behind it, stored
 * lower case and upper-cased on the way out. The API itself only ever writes
 * these two — `classworkType` in apps/api/src/validation/activity.schema.ts is
 * the only door in, and it is a two-value enum — so this is what every row the
 * system creates holds. A row written another way could hold anything, and
 * this union would not know.
 */
export type ActivityType = "INDIVIDUAL" | "GROUP";

/**
 * One activity, in full. The service spreads the `activities` row and adds
 * three things to it: `activity_id` beside the row's own `id`, the type
 * upper-cased, and the attachments.
 */
export type ActivityDetailResp = {
  id: number;
  /** The same number as `id`. Both are sent; the frontend reads both. */
  activity_id: number;
  activity_type: ActivityType;
  activity_name: string;
  description: string | null;
  score_number: number | null;
  score_ratio_id: number | null;
  section_id: number | null;
  course_syllabus_id: number | null;
  expected_level: number | null;
  is_average_score: boolean;
  is_self_assessment: boolean;
  /**
   * Whatever the editor saved. The column is `Json?` and the schema guarding
   * the way in accepts any JSON, so the API genuinely does not know the shape
   * — `unknown` is the only honest thing to write, and it makes each reader
   * narrow at the point it decides what it is looking at. A recursive JSON
   * union was tried first and is not usable here: the value is held in a Redux
   * slice, and Immer's `Draft<T>` recurses through it until the compiler gives
   * up (TS2589). See ADR-0032.
   */
  detail: unknown;
  announcement_date: string | null;
  deadline_date: string | null;
  created_at: string | null;
  updated_at: string | null;

  /** null when the activity is in no score category — the relation is
   *  optional, and `score_ratio_id` is nullable. */
  subject_score_ratio: ScoreWeightDetail | null;
  rubric_activity_mapping: RubricDetail[];
  /** Never null: the service answers two lists whatever it finds. */
  attachments: AttachmentDetailResp;
};

/**
 * One row of the teacher's assessment list. Seven columns off the activity,
 * the score category it counts towards, and three counts over its submissions.
 */
export type ActivityListItem = {
  id: number;
  activity_type: ActivityType;
  activity_name: string;
  score_ratio_id: number | null;
  announcement_date: string | null;
  deadline_date: string | null;
  section_id: number | null;
  /** null when the activity is in no score category. Fewer columns than the
   *  detail endpoint's, because this one selects rather than joins. */
  subject_score_ratio: ScoreWeightBrief | null;

  student_count: number;
  submitted_count: number;
  pending_grading_count: number;
};
