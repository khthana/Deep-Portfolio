import { StudentActivityStatusDB } from "./student-activity.model";

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

//-----------------------------------------

export type GradebookPerActivityResp = {
  section_id: number;
  activities: ActivityData[];
};

export type ActivityData = {
  activity_id: number;
  activity_name: string;
  deadline_date: Date | null;
  full_score: number;
  /** null when nobody in the section has been marked yet — there is no
   *  highest, lowest or average of no marks, and 0 is a mark (#28). */
  max_score: number | null;
  mean_score: number | null;
  min_score: number | null;
  submitted_count: number;
  not_submitted_count: number;
  graded_count: number;
};
