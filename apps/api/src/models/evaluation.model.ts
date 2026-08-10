import { ClassworkCategory } from "./student.model";

export type GetStudentEvaluationList = {
  evaluations: StudentEvaluationData[];
};

/**
 * One row of the student's evaluation list.
 *
 * Two kinds of row share it. An activity row carries the student's mark and the
 * class statistics that go with it; a classroom-work row is only what was
 * handed in and when, because there is no score column on classroom work. The
 * fields the second kind has nothing to say about are left out of the response
 * rather than sent as null, so they are optional here — the type says what goes
 * over the wire, which is what #28 asked of it.
 */
export type StudentEvaluationData = {
  id: number;
  activity_id: number;
  activity_name: string;
  type: ClassworkCategory;
  status: string;

  deadline_date?: Date | null;
  full_score?: number | null;
  /** null once the row is an activity's and nobody in the section has been
   *  marked yet — no marks, no highest, lowest or average (#28). */
  max_score?: number | null;
  mean_score?: number | null;
  min_score?: number | null;
  submitted_count?: number | null;
  not_submitted_count?: number | null;
  graded_count?: number | null;
  score?: number | null;
};
