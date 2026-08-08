export type CreatePortfolioThesisReqBody = {
  name?: string;
  repository?: string;
  role_and_resp?: string;
  init_expect?: string;
  reflection?: string;
  is_show_repo?: boolean;
  is_show_role?: boolean;
  is_show_init?: boolean;
  is_show_reflec?: boolean;
};

export type UpdatePortfolioThesisReqBody =
  Partial<CreatePortfolioThesisReqBody> & {
    ids_to_delete?: number[];
  };

export type PortfolioThesisResp = {
  id: number;
  user_id: string;
  name: string | null;
  repository: string | null;
  role_and_resp: string | null;
  init_expect: string | null;
  reflection: string | null;
  is_show_repo: boolean | null;
  is_show_role: boolean | null;
  is_show_init: boolean | null;
  is_show_reflec: boolean | null;
  attachments?: {
    attachment_id: number;
    url: string | null;
    file_path: string | null;
    original_filename: string | null;
    file_size: number | null;
  }[];
};
