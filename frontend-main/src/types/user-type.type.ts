export type UserResp = {
  user_id: string;
  email: string;
  phone?: string | null;
  title_th?: string | null;
  first_name_th?: string | null;
  last_name_th?: string | null;
  title_en?: string | null;
  first_name_en?: string | null;
  last_name_en?: string | null;
  department_id?: string | null;
  program_id?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
};
