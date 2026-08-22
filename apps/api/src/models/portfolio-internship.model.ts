import type {
  CreatePortfolioInternshipFields,
  UpdatePortfolioInternshipFields,
} from "../validation/portfolio-sections.schema";

export type CreatePortfolioInternshipReqBody = CreatePortfolioInternshipFields;

export type UpdatePortfolioInternshipReqBody = UpdatePortfolioInternshipFields;

// PortfolioInternshipResp used to be declared here. It moved to
// @deep-portfolio/api-types (#68) as `PortfolioInternshipDetail`, with the shape its
// attachments list holds beside it as `PortfolioSectionAttachment` — import
// them from there. It was the only one of the six to get `attachments` right; both
// dates were `Date`, where the wire says string.
