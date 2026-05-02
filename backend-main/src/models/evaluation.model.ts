import { ClassworkCategory } from "./student.model";

export type GetStudentEvaluationList = {
  evaluations: StudentEvaluationData[];
};

export type StudentEvaluationData = {
  id: number;
  activity_id: number;
  activity_name: string;
  deadline_date: Date | null;
  full_score: number | null;
  max_score: number | null;
  mean_score: number | null;
  min_score: number | null;
  submitted_count: number | null;
  not_submitted_count: number | null;
  graded_count: number | null;

  score: number | null;
  status: string;
  type: ClassworkCategory;
};
