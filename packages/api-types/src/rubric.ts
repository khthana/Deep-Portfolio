/**
 * The marking scale attached to one piece of work.
 *
 * `GET /activity` includes the relation whole, so what a caller receives is the
 * `rubric_activity_mapping` row and its `rubric_levels` rows as they stand —
 * bookkeeping columns included. Written here as the wire carries them (#68);
 * whether the endpoint ought to send `created_by` at all is a separate
 * question this pass did not open.
 *
 * The level's `id` is contract, not incident: the edit form hands it back on a
 * save, and it is what says which row is which once a scale has been
 * renumbered underneath it (#39).
 */

export type RubricDetail = {
  id: number;
  activity_id: number;
  criteria: string;
  weight: number;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;

  rubric_levels: RubricLevel[];
};

export type RubricLevel = {
  id: number;
  rubric_id: number;
  level_no: number;
  description: string;
  created_at: string | null;
};
