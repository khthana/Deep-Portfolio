// PortfolioActivityType and PortfolioActivityAttachment used to be declared
// here. They were a second web copy of what /portfolio-activity answers —
// src/types/portfolio-activity-type.type.ts held a third — and three
// components imported this one under the other's name. All of it is
// @deep-portfolio/api-types now (#68): `PortfolioActivityDetail` and
// `PortfolioSectionAttachment`. This copy had `date` right where the API's
// said `Date`, and had the attachment's `url` and `original_filename`
// nullable where they cannot be.

export type CreatePortfolioActivityReq = {
  name: string;
  date?: string;
  role?: string;
  description?: string;
  is_show?: boolean;
};

export type UpdatePortfolioActivityReq = {
  name?: string;
  date?: string;
  role?: string;
  description?: string;
  is_show?: boolean;
  ids_to_delete?: number[];
};
