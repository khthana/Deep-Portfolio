export type AddCLOBody = {
  // year: string;
  // semester: number;
  // subject_id: string;
  clo_number: string;
  clo_detail: string;
  plo_id: number;
  created_by: string;
  section_id: number;
  // section_number: string;
};

export type UpdateCLOBody = {
  id: number;
  // clo_id: number;
  clo_detail: string;
  plo_id: number;
};
