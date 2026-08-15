/**
 * What the gradebook endpoints answer with — GET /gradebook/per-student and
 * GET /gradebook/per-activity, both teacher-only and both scoped to one
 * section.
 *
 * The two are the same marks read along different axes: per-student adds a
 * row up, per-activity adds a column up. Both are annotated onto
 * apps/api/src/services/gradebook.service.ts, which is where the arithmetic
 * that fills them lives. See docs/adr/0029-api-types-per-feature.md.
 *
 * The names carry `Gradebook` because everything in this package is re-exported
 * from one index — an `ActivityData` here would have to argue with the activity
 * feature's own when that one moves.
 */
import type { StudentActivityStatusDB } from "./student-activity";

export type GradebookPerStudentResp = {
  section_id: number;
  students: GradebookStudent[];
};

export type GradebookStudent = {
  student_id: string;
  student_name: string;
  // The three counts are a partition of the student's submissions: work not
  // handed in is missing, and what was handed in is late or on time by the
  // dates alone, whether or not it has been marked.
  on_time_submissions: number;
  late_submissions: number;
  missing_submissions: number;
  total_score: number;
  activities: GradebookStudentActivity[];
};

export type GradebookStudentActivity = {
  activity_id: number;
  activity_name: string;
  // `activities.score_number` is nullable, and the service reads it through
  // `Number()`, which turns a missing one into 0 rather than null. So this is
  // a number on the wire even where the column is empty.
  full_score: number;
  // null until the work has been marked. 0 is a mark.
  score: number | null;
  status: StudentActivityStatusDB;
};

export type GradebookPerActivityResp = {
  section_id: number;
  activities: GradebookActivity[];
};

export type GradebookActivity = {
  activity_id: number;
  activity_name: string;
  deadline_date: string | null;
  full_score: number;
  // null when nobody in the section has been marked — there is no highest,
  // lowest or average of no marks, and 0 is a mark (#28). The three counts
  // below still answer, because a submission waiting to be marked is a fact
  // either way.
  max_score: number | null;
  min_score: number | null;
  mean_score: number | null;
  submitted_count: number;
  not_submitted_count: number;
  graded_count: number;
};
