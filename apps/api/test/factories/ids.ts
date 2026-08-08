/**
 * Synthetic identifiers.
 *
 * The counters are module state, which means they restart at 1 in every test
 * file — and that is fine, because every test file also gets its own database.
 * The upside is that ids are short, stable, and readable in a failure message:
 * the second teacher a file creates is always 70000002.
 *
 * The prefixes are not decorative. student_id carries meaning in the schema —
 * admission_year is a generated column, left(student_id, 2)::int + 2500 — so a
 * student id has to start with two digits that make a plausible year.
 */

let users = 0;
let students = 0;
let subjects = 0;
let outcomes = 0;
let rubrics = 0;

/** users.user_id — VarChar(8). */
export function nextUserId(): string {
  return `70${String(++users).padStart(6, "0")}`;
}

/** student.student_id — VarChar(8), and a foreign key to users.user_id.
 *  The "65" prefix makes admission_year come out as 2565. */
export function nextStudentId(): string {
  return `65${String(++students).padStart(6, "0")}`;
}

/** subjects.subject_id. Eight characters, because semester_courses.subject_id
 *  is VarChar(8) even though subjects.subject_id is VarChar(20). */
export function nextSubjectId(): string {
  return `90${String(++subjects).padStart(6, "0")}`;
}

/** learning_outcomes.outcome_code — unique per programme, not globally, but a
 *  counter is simpler than tracking which programme a case used. */
export function nextOutcomeCode(): string {
  return `PLO${++outcomes}`;
}

/** rubrics.rubric_code — unique across the whole table, unlike outcome_code. */
export function nextRubricCode(): string {
  return `RUB${++rubrics}`;
}
