/**
 * What a student is told about their own marks — GET /evaluation/list, the one
 * endpoint a student uses to see how they are doing.
 *
 * The list holds two kinds of row and they are not the same shape. An activity
 * row is the teacher's own gradebook row spread whole, so it carries the class
 * statistics beside the student's mark — where you stand, not just what you
 * got. A classroom-work row carries neither, because there is no score column
 * on classroom work, and the keys it has nothing to say about are left out of
 * the response rather than sent as null (#28).
 *
 * That is why this is a union discriminated on `type` rather than one row with
 * every statistic marked optional. Optional fields describe a superset: they
 * also permit a classroom-work row carrying a score, which the endpoint has
 * never sent. See docs/adr/0030-evaluation-row-union.md.
 */
import type { GradebookActivity } from "./gradebook";
import type { StudentActivityStatusDB } from "./student-activity";

export type StudentEvaluationListResp = {
  evaluations: StudentEvaluationRow[];
};

export type StudentEvaluationRow =
  StudentEvaluationActivityRow | StudentEvaluationLearningActivityRow;

/** What both kinds of row answer. `id` is the submission's and `activity_id`
 *  is the work's; the table keys its rows by the second and links to the
 *  marked work by the first. */
type StudentEvaluationRowBase = {
  id: number;
  activity_id: number;
  activity_name: string;
  status: StudentActivityStatusDB;
};

/**
 * `GradebookActivity` is intersected rather than copied because the service
 * literally spreads that row into this one — the two cannot drift while it is
 * written this way. ADR-0029 §4 is about the drift itself, between a moved
 * shape and a feature that borrows it; the choice to write the borrowing as an
 * intersection is ADR-0030's own.
 */
export type StudentEvaluationActivityRow = StudentEvaluationRowBase &
  GradebookActivity & {
    type: "activity";
    /** The student's own mark. null until the work has been marked; 0 is a
     *  mark. A Decimal in the column, converted to a number by the service. */
    score: number | null;
  };

export type StudentEvaluationLearningActivityRow = StudentEvaluationRowBase & {
  type: "learning_activity";
};
