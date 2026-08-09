import type {
  CreatePortfolioActivityFields,
  UpdatePortfolioActivityFields,
} from "../validation/portfolio-sections.schema";

export type CreatePortfolioActivityReqBody = Omit<
  CreatePortfolioActivityFields,
  "user_id"
>;

export type UpdatePortfolioActivityReqBody = UpdatePortfolioActivityFields;

export type PortfolioActivityResp = {
  id: number;
  user_id: string;
  name: string;
  date: Date | null;
  role: string | null;
  description: string | null;
  is_show: boolean | null;
  attachments?: {
    attachment_id: number;
    url: string | null;
    file_path: string | null;
    original_filename: string | null;
    file_size: number | null;
  }[];
};
