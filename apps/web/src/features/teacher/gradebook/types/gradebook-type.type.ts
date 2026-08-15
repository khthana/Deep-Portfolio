import type { GradebookStudentActivity } from "@deep-portfolio/api-types";

/**
 * What the two gradebook tables hold, which is not what the endpoints answer.
 *
 * The responses themselves moved to @deep-portfolio/api-types (#68) — import
 * `GradebookPerStudentResp` and `GradebookPerActivityResp` from there. What is
 * left here is the row shapes antd is given: a `key` and a `no` that exist for
 * the table alone, the names the columns read by `dataIndex`, and the nesting
 * the page builds on the way in — the response counts three kinds of
 * submission side by side, and the row gathers them under `submit_status`
 * because one column renders all three.
 */

export type AssignmentHeaderColumnType = {
  activity_id: number;
  activity_name: string;
  full_score: number;
};

export type GradebookPerStudentDataType = {
  key: string;
  no: number;
  student_id: string;
  student_name: string;
  submit_status: {
    on_time: number;
    late: number;
    missing: number;
  };
  total_score: number;
  // Carried through unchanged: the per-activity cells are the response's own
  // rows, and writing them out again here is how the two drifted apart before.
  activities: GradebookStudentActivity[];
};

export type GradebookPerActivityDataType = {
  key: number;
  no: number;
  title: string;
  // The deadline as it arrives, which is a string — the column renders it
  // through convertDateToThaiFormat and nothing here does date arithmetic.
  deadline: string | null;
  submitted_count: number;
  not_submitted_count: number;
  graded_count: number;
  full_score: number;
  max: number | null;
  min: number | null;
  mean: number | null;
  id?: number;
  isNew?: boolean;
};
