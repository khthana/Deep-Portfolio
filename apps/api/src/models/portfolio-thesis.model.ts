import type {
  CreatePortfolioThesisFields,
  UpdatePortfolioThesisFields,
} from "../validation/portfolio-sections.schema";

export type CreatePortfolioThesisReqBody = Omit<
  CreatePortfolioThesisFields,
  "user_id"
>;

export type UpdatePortfolioThesisReqBody = UpdatePortfolioThesisFields;

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
