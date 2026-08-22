// SharedRubricResp and SharedRubricDetailResp used to be declared here. They
// moved to @deep-portfolio/api-types (#68) as `SharedRubric` and
// `SharedRubricCriterion` — import them from there. Both copies were right
// field for field; what they were missing was a name saying that the second is
// one criterion rather than "the detail" of the first. See ADR-0046.
//
// What stays is the form's own shapes. They are not the response: a criterion
// on the form has `criteria` and `levels[]`, which is the activity's own scale
// being written, not a row of the catalogue being read from.

export type CreateRubricFormType = {
  expected_level: number;
  rubrics: RubricDetailForm[];
};

export type RubricDetailForm = {
  /** `rubric_activity_mapping.id`, on a criterion the edit form was given. A
   *  criterion the teacher added here has none until it is saved — see
   *  `utils/rubric-payload.ts` for why it has to travel back (#25). */
  id?: number;
  criteria: string;
  weight: number;
  levels: RubricLevelForm[];
  _shared_rubric_index?: number; // Track index from shared rubric for deletion
  _shared_rubric_title_key?: string; // Track shared rubric title key for modal uncheck
  _shared_rubric_detail_key?: string; // Track shared rubric detail key for deduping
};

export type AddRubricDetail = {
  criteria: string;
  weight: number;
  levels: RubricLevelForm[];
};

/** One level of a criterion on the form. `RubricLevelForm`, not `RubricLevel`:
 *  that name belongs to the `rubric_levels` row in @deep-portfolio/api-types,
 *  and this is the row being written rather than the row that came back — the
 *  two differ on `id`, which is optional here (#68). Named for its sibling
 *  `RubricDetailForm` above. */
export type RubricLevelForm = {
  /** `rubric_levels.id`, on a level the edit form was given — what says which
   *  level a row is once `level_no` has been renumbered under it (#39). A level
   *  the teacher just added here has none until it is saved. */
  id?: number;
  level_no: number;
  description: string;
};
