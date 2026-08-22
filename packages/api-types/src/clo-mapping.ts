/**
 * What a piece of work measures — `/mapping/activity` and
 * `/mapping/learning-activity`.
 *
 * This is the join the outcome-based model rests on: without it a mark is just
 * a number, and with it the same mark counts towards a CLO and through that a
 * PLO. Four shapes, two per half: the row a mapping creates, and the activity
 * a mapping points at as the teacher's mapping screen draws it.
 *
 * The two halves are not symmetrical, and the tables say why. An activity has
 * a score, so its mapping records how much of that score the CLO is worth and
 * caches the resulting number; a learning activity is not marked, so its
 * mapping is the link and nothing else.
 *
 * Neither `clo_id` has a foreign key behind it, which is why both are nullable
 * here — nothing stops a mapping pointing at a CLO that was deleted or never
 * existed.
 *
 * The two name families read alike and are not: `ActivityCLOMapping` is the
 * `activity_clo_mapping` row, named after its table, and `CLOMappedActivity`
 * is an `activities` row as the screen draws it once a mapping points at it.
 * The word order says which — the mapping, or the thing mapped.
 */

/**
 * `POST /mapping/activity` — the `activity_clo_mapping` row that was created,
 * in full.
 *
 * `sequence_order` is not sent by the caller: the endpoint takes the highest
 * one already on the activity and adds one.
 *
 * `score` is the cached product of the activity's `score_number` and the
 * `weight` the caller asked for. The column is `Decimal(5,2)`, which reaches
 * the wire as a string unless the service converts it, and it does (#33).
 */
export type ActivityCLOMapping = {
  id: number;
  activity_id: number;
  sequence_order: number;
  /** Whole percent, `0` by default — what share of the activity's score this
   *  CLO is worth. */
  weight: number;
  clo_id: number | null;
  /** Copied off the activity when the mapping is written, and a real foreign
   *  key — which is why `POST` refuses an activity with no score category. */
  score_ratio_id: number;
  created_at: string | null;
  updated_at: string | null;
  score: number;
  /** `String?`, and nothing in the system writes it. Sent because the created
   *  row is the response. */
  detail: string | null;
};

/**
 * `POST /mapping/learning-activity` — the
 * `learning_activity_clo_mapping` row that was created, in full. Six columns
 * against the activity half's ten: there is no score to divide, so there is no
 * `weight`, no `score` and no category to point at.
 */
export type LearningActivityCLOMapping = {
  id: number;
  learning_activity_id: number;
  sequence_order: number;
  clo_id: number | null;
  created_at: string | null;
  updated_at: string | null;
};

/**
 * One row of `GET /mapping/activity` — an activity mapped to a CLO, as the
 * card on the teacher's mapping screen draws it.
 *
 * Four columns off `activities` and two things beside them, rather than the
 * whole row: until #68 the query had no `select` and answered all sixteen,
 * including `activity_type`, which this endpoint sends as the column stores it
 * — lower case, unlike `GET /activity`, which upper-cases on the way out
 * (ADR-0037). Nothing on this screen read it. See
 * docs/adr/0047-narrow-to-the-card.md.
 */
export type CLOMappedActivity = {
  id: number;
  activity_name: string;
  /** Whatever the editor saved, and `unknown` for the reason
   *  `ActivityDetailResp.detail` is — see the note there. */
  detail: unknown;
  /** Which of the rubric's levels this activity is aiming at. Nullable, and
   *  the card compares it against every level it draws, so a null simply
   *  highlights none of them. */
  expected_level: number | null;
  /**
   * How many levels there are to draw — the highest `level_no` under the
   * activity's *first* criterion. `rubric_levels.rubric_id` points at a
   * `rubric_activity_mapping` row, which is one criterion rather than a whole
   * rubric, and the service takes the first of them with `findFirst`.
   *
   * Null when the activity has no criteria at all, and the card draws no
   * levels then.
   */
  level_no: number | null;
  /** Off the mapping row rather than the activity: what share of the
   *  activity's score this CLO is worth. */
  weight: number;
};

/**
 * One row of `GET /mapping/learning-activity` — three columns where the
 * activity half has six, because the card beside it draws a name and a
 * description and nothing else.
 */
export type CLOMappedLearningActivity = {
  id: number;
  learning_activity_name: string;
  /** Whatever the editor saved. Same reasoning as `CLOMappedActivity.detail`. */
  detail: unknown;
};
