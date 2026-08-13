import type {
  CreatePortfolioCertificateFields,
  UpdatePortfolioCertificateFields,
} from "../validation/portfolio-sections.schema";

export type CreatePortfolioCertificateReqBody =
  CreatePortfolioCertificateFields;

export type UpdatePortfolioCertificateReqBody =
  UpdatePortfolioCertificateFields;

export type PortfolioCertificateResp = {
  id: number;
  user_id: string;
  date: Date | null;
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
