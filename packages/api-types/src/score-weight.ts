/**
 * A section's score categories — the buckets a mark counts towards.
 *
 * Two shapes, because two endpoints read the same table differently and a
 * single type was hiding the difference until #68: `GET /activity/list` names
 * the five columns it wants, while `GET /activity` joins the relation whole and
 * so hands the bookkeeping columns out with it.
 *
 * Only the shapes nested inside the activity responses are here. `GET
 * /score-weight` has its own pass still to come, and answers the whole row —
 * so it will find `ScoreWeightDetail` already written for it.
 */

/** What `GET /activity/list` selects. */
export type ScoreWeightBrief = {
  score_ratio_id: number;
  sequence_order: number;
  score_category: string;
  /** `smallint` with a default of 0, but the column takes null. */
  weight: number | null;
  section_id: number | null;
};

/** What `GET /activity` joins — the row, bookkeeping included. */
export type ScoreWeightDetail = ScoreWeightBrief & {
  created_at: string | null;
  updated_at: string | null;
};
