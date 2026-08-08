export type SharedRubricResp = {
  id: number;
  rubric_code: string;
  rubric_name_en: string;
  rubric_name_th: string;
  display_order: number | null;
  created_by: string | null;
  updated_by: string | null;
  program_id: string | null;
};

export type SharedRubricDetailResp = {
  id: number;
  display_order: number | null;
  created_by: string | null;
  updated_by: string | null;
  rubric_id: number;
  criteria_name_en: string;
  criteria_name_th: string;
  level_4_description: string | null;
  level_3_description: string | null;
  level_2_description: string | null;
  level_1_description: string | null;
  weight: number | null;
};

export type CreateRubricFormType = {
  expected_level: number;
  rubrics: RubricDetailForm[];
};

export type RubricDetailForm = {
  criteria: string;
  weight: number;
  levels: RubricLevel[];
  _shared_rubric_index?: number; // Track index from shared rubric for deletion
  _shared_rubric_title_key?: string; // Track shared rubric title key for modal uncheck
  _shared_rubric_detail_key?: string; // Track shared rubric detail key for deduping
};

export type AddRubricDetail = {
  criteria: string;
  weight: number;
  levels: RubricLevel[];
};

export type RubricLevel = {
  level_no: number;
  description: string;
};
