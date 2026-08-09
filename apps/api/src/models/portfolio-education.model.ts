import type {
  CreatePortfolioEducationFields,
  UpdatePortfolioEducationFields,
} from "../validation/portfolio-sections.schema";

export type CreatePortfolioEducationReqBody = Omit<
  CreatePortfolioEducationFields,
  "user_id"
>;

export type UpdatePortfolioEducationReqBody = UpdatePortfolioEducationFields;

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
