import type {
  CreatePortfolioAwardFields,
  UpdatePortfolioAwardFields,
} from "../validation/portfolio-sections.schema";

/**
 * What the service is handed, which is what the schema let through. The owner
 * is not in it: since #31 the request cannot name one, and the controller
 * passes the session's separately.
 */
export type CreatePortfolioAwardReqBody = CreatePortfolioAwardFields;

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
