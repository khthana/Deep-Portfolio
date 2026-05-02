export type AddScoreWeightBody = {
  // year: string;
  // semester: number;
  // subject_id: string;
  score_category: string;
  weight: number;
  sequence_order: number;
  created_by: string;
  section_id: number;
  // section_number: string;
};

export type UpdateScoreWeightBody = {
  score_id: number;
  score_category: string;
  weight: number;
};
