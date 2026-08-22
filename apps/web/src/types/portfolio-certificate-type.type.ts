// PortfolioCertificateResp and the AttachmentResp beside it used to be declared
// here. They moved to @deep-portfolio/api-types (#68) as
// `PortfolioCertificateDetail` and `PortfolioSectionAttachment` — import them
// from there. Thirteen copies of that attachment shape were written out by
// hand across the two sides — twelve of them identical, and all twelve
// wrong; ADR-0041 has what each got wrong.

export type CreatePortfolioCertificateReq = {
  date?: string;
  organize?: string;
  name?: string;
  description?: string;
  is_show?: boolean;
};

export type UpdatePortfolioCertificateReq =
  Partial<CreatePortfolioCertificateReq> & {
    ids_to_delete?: number[];
  };
