type Student = {
  student_id: string;
  first_name_th: string;
  last_name_th: string;
};

/**
 * As much of a submission as the two columns naming who is being marked need.
 * Each teacher marking table has its own `Submission` type — the graded half
 * carries a score, the learning-activity half does not — and both satisfy this.
 */
export type MarkedSubmission = {
  submission_type: string;
  student?: Student;
  group?: { members: Student[] };
};

/**
 * The student codes and names this submission's mark lands on: every member of
 * the group for group work — `members` has meant ACCEPT only since ADR-0017, so
 * the people still sitting on their invitation are not among them — and the one
 * student otherwise.
 *
 * The two lists are built together because they are two columns of the same
 * row: the third name down in one is the third code down in the other, and a
 * teacher reads them across. Where the side of the branch the submission claims
 * is missing, both come back empty rather than a row that names the wrong
 * people.
 */
export function formatMarkedStudents(submission: MarkedSubmission): {
  codes: string[];
  names: string[];
} {
  const students =
    submission.submission_type === "GROUP"
      ? (submission.group?.members ?? [])
      : submission.student
        ? [submission.student]
        : [];

  return {
    codes: students.map((student) => student.student_id),
    names: students.map(
      (student) => `${student.first_name_th} ${student.last_name_th}`,
    ),
  };
}
