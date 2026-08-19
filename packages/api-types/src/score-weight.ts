/**
 * A section's score categories — the buckets a mark counts towards.
 *
 * Two shapes for five endpoints, because one of them reads the table
 * differently and a single type was hiding that until #68: `GET /activity/list`
 * names the five columns it wants, while `GET /activity` joins the relation
 * whole and so hands the bookkeeping columns out with it.
 *
 * The prediction that pass left behind held: `GET /score-weight` answers the
 * whole row, so when its own pass came it found `ScoreWeightDetail` already
 * written for it and added no third shape. `PUT` and `DELETE` answer the same
 * row again — the one it updated, and the one it removed.
 *
 * `POST /score-weight` is the exception and has no type here: it answers the
 * new `score_ratio_id` as a bare number, not an object holding one. `GET
 * /score-weight/options` has none either, and for the reason ADR-0032 gave
 * about `/activity/options` — `{ label, value }` is a shape the web asked the
 * API for, not one the API decided, which is the same kind of question as the
 * envelope in #67.
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

/** The row, bookkeeping included — what `GET /activity` joins, and what all
 *  three of `GET`, `PUT` and `DELETE /score-weight` answer.
 *
 *  `updated_at` is not what its name suggests: the column has a default and no
 *  `@updatedAt` behind it, so a `PUT` hands back the value the row was created
 *  with. Pinned by a case rather than left to be discovered (#68). */
export type ScoreWeightDetail = ScoreWeightBrief & {
  created_at: string | null;
  updated_at: string | null;
};
