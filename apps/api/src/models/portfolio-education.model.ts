import type {
  CreatePortfolioEducationFields,
  UpdatePortfolioEducationFields,
} from "../validation/portfolio-sections.schema";

export type CreatePortfolioEducationReqBody = CreatePortfolioEducationFields;

export type UpdatePortfolioEducationReqBody = UpdatePortfolioEducationFields;

// PortfolioEducationResp used to be declared here. It moved to
// @deep-portfolio/api-types (#68) as `PortfolioEducationDetail` — import it
// from there. It said the same thing this file did, field for field.
