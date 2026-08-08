export type UserDetail = {
  user_id: string;
  full_name_th: string;
  full_name_en: string;
  title_th: string;
  title_en: string;
  email: string;
  phone: string;
  role: string;
};

export type StudentDetail = {
  user_id: string;
  student_id: string;
  full_name_th: string | null;
  //   full_name_en: string;
  first_name_th: string;
  last_name_th: string;

  title_th: string | null;
  email: string | null;
  phone: string | null;
  department_name: string;
  program_name: string;
};
