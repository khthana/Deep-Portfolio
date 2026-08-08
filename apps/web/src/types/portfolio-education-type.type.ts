export type PortfolioEducationResp = {
  id: number;
  user_id: string;
  education_level: string;
  institution: string | null;
  start_year: number | null;
  end_year: number | null;
  country: string | null;
  gpa: number | null;
  study_plan: string | null;
  faculty: string | null;
  major: string | null;
  is_show: boolean | null;
};

export type CreatePortfolioEducationReq = {
  user_id: string;
  education_level: string;
  institution?: string;
  start_year?: number;
  end_year?: number;
  country?: string;
  gpa?: number;
  study_plan?: string;
  faculty?: string;
  major?: string;
  is_show?: boolean;
};

export type UpdatePortfolioEducationReq = Partial<CreatePortfolioEducationReq>;
