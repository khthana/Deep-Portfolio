import type {
  CreatePortfolioAwardFields,
  UpdatePortfolioAwardFields,
} from "../validation/portfolio-sections.schema";

/**
 * What the service is handed, which is what the schema let through — minus
 * `user_id`, which the controller passes separately because it is the owner of
 * the row rather than one of its columns.
 */
export type CreatePortfolioAwardReqBody = Omit<
  CreatePortfolioAwardFields,
  "user_id"
>;

export type UpdatePortfolioAwardReqBody = UpdatePortfolioAwardFields;

export type PortfolioAwardResp = {
  id: number;
  user_id: string;
  organize: string | null;
  name: string | null;
  award: string | null;
  date: Date | null;
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
