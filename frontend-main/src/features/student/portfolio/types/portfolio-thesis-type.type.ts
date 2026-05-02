export type PortfolioThesisResp = {
  id: number;
  user_id: string;
  name: string;
  repository: string | null;
  role_and_resp: string | null;
  init_expect: string | null;
  reflection: string | null;
  is_show_repo: boolean;
  is_show_role: boolean;
  is_show_init: boolean;
  is_show_reflec: boolean;
  attachments: PortfolioThesisAttachment[];
};

export type PortfolioThesisAttachment = {
  attachment_id: number;
  url: string;
  file_path: string | null;
  original_filename: string;
  file_size: string | null;
};

export type CreatePortfolioThesisReq = {
  user_id: string;
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
