// PortfolioPersonalResp used to be declared here. It moved to
// @deep-portfolio/api-types (#68) and split in two: `PortfolioPersonalDetail`
// for the read, which carries the picture, and `PortfolioPersonalRow` for the
// four writes, which do not. What this said that the endpoints do not: every
// field but `user_id` was optional, so a reader could not tell a field that is
// null from one that was never sent — and only `attachments` is ever the
// latter. See ADR-0033.

export type UpsertPortfolioPersonalReq = {
  nationality?: string;
  race?: string;
  date_of_birth?: string | Date | null; // ISO string or Date object
  phone_number?: string;
  email?: string;
  github?: string;
  linkedin?: string;
  attachment_id?: number | null;
};
