export type StudentDetailResp = {
  student_id?: string | undefined;
  created_at?: Date | null | undefined;
  updated_at?: Date | null | undefined;
  first_name_th?: string | undefined;
  last_name_th?: string | undefined;
  full_name_th?: string | null | undefined;
  department_id?: string | undefined;
  program_id?: string | undefined;
  //   status?: $Enums.student_status_enum | null | undefined;
  admission_year?: string | null | undefined;
};
