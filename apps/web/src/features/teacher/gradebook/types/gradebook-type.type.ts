import type { StudentActivityStatusDB } from "../../../../types/activity-type.type";

export type GradebookPerStudentResp = {
  section_id: number;
  students: StudentSubmittionData[];
};

export type StudentSubmittionData = {
  student_id: string;
  student_name: string;
  on_time_submissions: number;
  late_submissions: number;
  missing_submissions: number;
  total_score: number;
  activities: StudentActivityData[];
};

export type StudentActivityData = {
  activity_id: number;
  activity_name: string;
  full_score: number;
  score: number | null;
  status: StudentActivityStatusDB;
};

//----------------------------------------------

export type GradebookPerActivityResp = {
  section_id: number;
  activities: ActivityData[];
};

export type ActivityData = {
  activity_id: number;
  activity_name: string;
  deadline_date: Date | null;
  full_score: number;
  // null until somebody in the section has been marked — there is no highest,
  // lowest or average of no marks, and 0 is a mark (#28).
  max_score: number | null;
  mean_score: number | null;
  min_score: number | null;
  submitted_count: number;
  not_submitted_count: number;
  graded_count: number;
};

//----------------------------------------------

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
  activities: {
    activity_id: number;
    activity_name: string;
    full_score: number;
    score: number | null;
    status: StudentActivityStatusDB;
  }[];
};

export type GradebookPerActivityDataType = {
  key: number;
  no: number;
  title: string;
  deadline: Date | null;
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
