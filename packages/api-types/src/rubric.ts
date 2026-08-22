/**
 * Marking scales, in the two senses this system has of them.
 *
 * `RubricDetail` and `RubricLevel` are one activity's own scale — the rows of
 * `rubric_activity_mapping` and `rubric_levels` that a teacher wrote for that
 * piece of work, which `GET /activity` answers as part of the activity.
 *
 * `SharedRubric` and `SharedRubricCriterion` at the bottom are the programme's
 * catalogue — `rubrics` and `rubric_details`, reference data nothing in the
 * API writes, which a teacher copies criteria out of while writing the first
 * kind. Different tables, and a criterion there carries its four level
 * descriptions as columns of one row where a scale here carries them as rows.
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

/**
 * `GET /rubric/shared-rubric` — the programme's rubrics, for the modal a
 * teacher copies criteria out of when writing an activity's own scale.
 *
 * Reference data: nothing in the API writes `rubrics`, so this and
 * `SharedRubricCriterion` below are the feature's only two shapes. How they
 * differ from the scale at the top of this file is in the file's own note.
 *
 * `SharedRubricResp` was its name on both sides. What needed renaming was its
 * partner: `SharedRubricDetailResp` reads as "the detail of a shared rubric"
 * when one row is one criterion. The `Resp` went with it because it earns
 * nothing here — the package is not consistent about the suffix (23 exports
 * carry it, over both whole bodies and single rows), so dropping it settles
 * nothing beyond these two names (ADR-0029 §1, ADR-0046 §2).
 *
 * All eight columns of `rubrics`, and the query names all eight. It sent them
 * before too — `findMany` with no `select` — but that was the absence of a
 * decision rather than one, and the next column added to the table would have
 * gone out with them (ADR-0044 §1).
 */
export type SharedRubric = {
  id: number;
  rubric_code: string;
  rubric_name_en: string;
  rubric_name_th: string;
  display_order: number | null;
  created_by: string | null;
  updated_by: string | null;
  program_id: string | null;
};

/**
 * `GET /rubric/shared-rubric/detail` — one shared rubric's criteria, in
 * display order.
 *
 * One row is one criterion, with its four level descriptions beside it as
 * columns. Of the twelve, the modal draws six — the Thai name, the four
 * descriptions, and `display_order` as the row number — and keys its rows on
 * `id`. The other five (`rubric_id`, the English name, `weight`, `created_by`
 * and `updated_by`) are sent and never touched.
 *
 * `weight` is `Decimal(5,2)` and the service converts it — a string on the
 * wire otherwise (#33). Nullable because the column is, `@default(1.00)`
 * notwithstanding.
 */
export type SharedRubricCriterion = {
  id: number;
  rubric_id: number;
  criteria_name_en: string;
  criteria_name_th: string;
  level_4_description: string | null;
  level_3_description: string | null;
  level_2_description: string | null;
  level_1_description: string | null;
  weight: number | null;
  display_order: number | null;
  created_by: string | null;
  updated_by: string | null;
};
