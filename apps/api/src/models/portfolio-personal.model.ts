import type { PortfolioPersonalFields } from "../validation/portfolio-personal.schema";

/**
 * Create and update take the same fields.
 *
 * They always have — whose row it is arrives beside the fields rather than
 * among them, from the session since #31 — but the declared types
 * said every field was optional, which is what let the service treat `""` and
 * the string `"null"` as values worth a runtime pass of their own. Every field
 * here is `T | null | undefined`: sent, sent empty, or not sent.
 */
export type CreatePortfolioPersonalReqBody = PortfolioPersonalFields;

export type UpdatePortfolioPersonalReqBody = PortfolioPersonalFields;

// PortfolioPersonalResp used to be declared here. It moved to
// @deep-portfolio/api-types (#68) and split in two on the way:
// `PortfolioPersonalRow` for the four writes and `PortfolioPersonalDetail` for
// the read. What it said that the endpoints do not: `date_of_birth` is a
// string on the wire, not a `Date`; and `attachments` was optional on one type
// covering both, which read as "sometimes null" when what it means is that a
// write has no such key at all. See ADR-0033 for that distinction.
