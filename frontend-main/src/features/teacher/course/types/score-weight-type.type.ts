export type GetScoreWeightParams = {
  course_id: string;
  teacher_id: string;
};

export type AddScoreWeightBody = {
  score_category: string;
  weight: number;
  sequence_order: number;
  created_by: string;
  section_id: number;
};

export type ScoreWeightFormType = {
  title: string;
  score_category: string;
  weight: number;
};

export type UpdateScoreWeightBody = {
  score_id: number;
  score_category: string;
  weight: number;
};
