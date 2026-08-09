import type {
  CreatePortfolioTrainingFields,
  UpdatePortfolioTrainingFields,
} from "../validation/portfolio-sections.schema";

export type CreatePortfolioTrainingReqBody = Omit<
  CreatePortfolioTrainingFields,
  "user_id"
>;

export type UpdatePortfolioTrainingReqBody = UpdatePortfolioTrainingFields;

export type PortfolioTrainingResp = {
  id: number;
  user_id: string;
  year: number | null;
  country: string | null;
  organize: string | null;
  name: string | null;
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
