import type { StudentNameBrief } from "@deep-portfolio/api-types";

/**
 * As much of a submission as the two columns naming who is being marked need.
 *
 * A union on `submission_type` rather than one shape with `student` and `group`
 * both optional, which is what it was until #68 — the API's own rows became
 * unions in that pass, and both satisfy this one structurally. Narrowing it
 * this way is what lets the body below take the half that is really there
 * instead of guarding for the other one's absence.
 *
 * Still only the two fields it reads, not the whole row: this is a formatter
 * for two table columns, and a case testing it should not have to build a
 * submission to call it.
 */
export type MarkedSubmission =
  | { submission_type: "INDIVIDUAL"; student: StudentNameBrief }
  | { submission_type: "GROUP"; group: { members: StudentNameBrief[] } };

/**
 * The student codes and names this submission's mark lands on: every member of
 * the group for group work — `members` has meant ACCEPT only since ADR-0017, so
 * the people still sitting on their invitation are not among them — and the one
 * student otherwise.
 *
 * The two lists are built together because they are two columns of the same
 * row: the third name down in one is the third code down in the other, and a
 * teacher reads them across.
 */
export function formatMarkedStudents(submission: MarkedSubmission): {
  codes: string[];
  names: string[];
} {
  const students =
    submission.submission_type === "GROUP"
      ? submission.group.members
      : [submission.student];

  return {
    codes: students.map((student) => student.student_id),
    names: students.map(
      (student) => `${student.first_name_th} ${student.last_name_th}`,
    ),
  };
}
