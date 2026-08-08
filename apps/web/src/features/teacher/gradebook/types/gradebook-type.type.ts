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
  max_score: number;
  mean_score: number;
  min_score: number;
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
  max: number;
  min: number;
  mean: number;
  id?: number;
  isNew?: boolean;
};
