import type {
  CreatePortfolioThesisFields,
  UpdatePortfolioThesisFields,
} from "../validation/portfolio-sections.schema";

export type CreatePortfolioThesisReqBody = CreatePortfolioThesisFields;

export type UpdatePortfolioThesisReqBody = UpdatePortfolioThesisFields;

// PortfolioThesisResp used to be declared here. It moved to
// @deep-portfolio/api-types (#68) as `PortfolioThesisDetail`, with the shape its
// attachments list holds beside it as `PortfolioSectionAttachment` — import
// them from there. It said `attachments` was optional; every endpoint that answers a
// row answers that key too.
