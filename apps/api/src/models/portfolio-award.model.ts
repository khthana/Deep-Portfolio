import type {
  CreatePortfolioAwardFields,
  UpdatePortfolioAwardFields,
} from "../validation/portfolio-sections.schema";

/**
 * What the service is handed, which is what the schema let through. The owner
 * is not in it: since #31 the request cannot name one, and the controller
 * passes the session's separately.
 */
export type CreatePortfolioAwardReqBody = CreatePortfolioAwardFields;

export type UpdatePortfolioAwardReqBody = UpdatePortfolioAwardFields;

// PortfolioAwardResp used to be declared here. It moved to
// @deep-portfolio/api-types (#68) as `PortfolioAwardDetail`, with the shape its
// attachments list holds beside it as `PortfolioSectionAttachment` — import
// them from there. It said `attachments` was optional, where every endpoint that answers
// a row answers that key, and `date` was a `Date`, where the wire says string.
