/**
 * How a student is named when some other feature's response points at one.
 *
 * Only these two shapes are here. The student feature has endpoints of its own
 * — the classroom page, the e-Portfolio — and none of them has moved yet (#68);
 * these are the pieces the submission endpoints embed, which is why they are in
 * this file rather than in the file of whichever feature moved first
 * (ADR-0029 §2).
 */

/** What a detail response sends: the name, without the id it was looked up by. */
export type StudentFullNameTh = {
  first_name_th: string;
  last_name_th: string;
};

/** What a roster sends: the same name, plus the id the row is keyed on. */
export type StudentNameBrief = StudentFullNameTh & {
  student_id: string;
};
