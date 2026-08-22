import type {
  CreatePortfolioActivityFields,
  UpdatePortfolioActivityFields,
} from "../validation/portfolio-sections.schema";

export type CreatePortfolioActivityReqBody = CreatePortfolioActivityFields;

export type UpdatePortfolioActivityReqBody = UpdatePortfolioActivityFields;

// PortfolioActivityResp used to be declared here. It moved to
// @deep-portfolio/api-types (#68) as `PortfolioActivityDetail`, with the shape its
// attachments list holds beside it as `PortfolioSectionAttachment` — import
// them from there. It said `attachments` was optional, where every endpoint that answers
// a row answers that key, and `date` was a `Date`, where the wire says string.
