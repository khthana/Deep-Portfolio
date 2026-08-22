// PortfolioAwardResp and the AttachmentResp beside it used to be declared
// here. They moved to @deep-portfolio/api-types (#68) as
// `PortfolioAwardDetail` and `PortfolioSectionAttachment` — import them
// from there. Thirteen copies of that attachment shape were written out by
// hand across the two sides — twelve of them identical, and all twelve
// wrong; ADR-0041 has what each got wrong.

export type CreatePortfolioAwardReq = {
  organize?: string;
  name?: string;
  award?: string;
  date?: string;
  description?: string;
  is_show?: boolean;
};

export type UpdatePortfolioAwardReq = Partial<CreatePortfolioAwardReq> & {
  ids_to_delete?: number[];
};
