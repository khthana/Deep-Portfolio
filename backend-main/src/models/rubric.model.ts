export type AddRubricDetail = {
  criteria: string;
  weight: number;
  levels: RubricLevel[];
};

export type RubricLevel = {
  level_no: number;
  description: string;
};
