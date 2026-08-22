// PortfolioActivityResp and the PortfolioActivityAttachment beside it used to
// be declared here. They moved to @deep-portfolio/api-types (#68) as
// `PortfolioActivityDetail` and `PortfolioSectionAttachment` — import them
// from there. Thirteen copies of that attachment shape were written out by
// hand across the two sides — twelve of them identical, and all twelve
// wrong; ADR-0041 has what each got wrong.

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
