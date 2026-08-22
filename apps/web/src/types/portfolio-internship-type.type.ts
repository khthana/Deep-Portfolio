// PortfolioInternshipResp and the AttachmentResp beside it used to be declared
// here. They moved to @deep-portfolio/api-types (#68) as
// `PortfolioInternshipDetail` and `PortfolioSectionAttachment` — import them
// from there. Thirteen copies of that attachment shape were written out by
// hand across the two sides — twelve of them identical, and all twelve
// wrong; ADR-0041 has what each got wrong.

export interface CreatePortfolioInternshipReq {
  type: string;
  title?: string;
  position: string;
  company: string;
  country: string;
  province?: string;
  start_date?: string;
  end_date?: string;
  resp?: string;
  is_show_resp?: boolean;
  learning_out?: string;
  is_show_learning?: boolean;
  reflection?: string;
  is_show_reflec?: boolean;
}

export type UpdatePortfolioInternshipReq =
  Partial<CreatePortfolioInternshipReq> & {
    ids_to_delete?: number[];
  };
