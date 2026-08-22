import type {
  CreatePortfolioFields,
  UpdatePortfolioFields,
} from "../validation/portfolio.schema";

export type CreatePortfolioReqBody = CreatePortfolioFields;

export type UpdatePortfolioReqBody = UpdatePortfolioFields;

// PortfolioResp and PortfolioTemplateResp used to be declared here. They moved
// to @deep-portfolio/api-types (#68) as `PortfolioDetail` and
// `PortfolioTemplateDetail`, with the aggregate read behind the share link
// beside them as `PublicPortfolioDetail` — import them from there. Three things
// PortfolioResp said that the endpoints do not: `shareExpiresAt` was a `Date`,
// which no caller of a JSON API ever receives; and `templateName`,
// `publicShareToken` and `shareExpiresAt` were all optional, where one mapping
// function builds every response in the file and sets all three every time.
