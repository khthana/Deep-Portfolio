// PortfolioThesisResp and PortfolioThesisAttachment used to be declared here.
// They moved to @deep-portfolio/api-types (#68) as `PortfolioThesisDetail` and
// `PortfolioSectionAttachment` — import them from there. This copy and the
// API's were each right about a half the other had wrong: this one knew `url`
// and `original_filename` are never null, and had `file_size` as a string and
// `name` and the four `is_show_*` flags as non-nullable, which the columns are
// not.

export type CreatePortfolioThesisReq = {
  name: string;
  repository?: string;
  role_and_resp?: string;
  init_expect?: string;
  reflection?: string;
  is_show_repo?: boolean;
  is_show_role?: boolean;
  is_show_init?: boolean;
  is_show_reflec?: boolean;
};

export type UpdatePortfolioThesisReq = Partial<CreatePortfolioThesisReq> & {
  ids_to_delete?: number[];
};
