// PortfolioEducationResp used to be declared here. It moved to
// @deep-portfolio/api-types (#68) as `PortfolioEducationDetail` — import it
// from there. It said the same thing the API did, field for field, which is
// rare enough in this issue to be worth writing down.

export type CreatePortfolioEducationReq = {
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
