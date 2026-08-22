import type {
  CreatePortfolioCertificateFields,
  UpdatePortfolioCertificateFields,
} from "../validation/portfolio-sections.schema";

export type CreatePortfolioCertificateReqBody =
  CreatePortfolioCertificateFields;

export type UpdatePortfolioCertificateReqBody =
  UpdatePortfolioCertificateFields;

// PortfolioCertificateResp used to be declared here. It moved to
// @deep-portfolio/api-types (#68) as `PortfolioCertificateDetail`, with the shape its
// attachments list holds beside it as `PortfolioSectionAttachment` — import
// them from there. It said `attachments` was optional, where every endpoint that answers
// a row answers that key, and `date` was a `Date`, where the wire says string.
