import type {
  CreatePortfolioInternshipFields,
  UpdatePortfolioInternshipFields,
} from "../validation/portfolio-sections.schema";

export type CreatePortfolioInternshipReqBody = CreatePortfolioInternshipFields;

export type UpdatePortfolioInternshipReqBody = UpdatePortfolioInternshipFields;

export interface PortfolioInternshipResp {
  id: number;
  user_id: string;
  type: string;
  title: string | null;
  position: string | null;
  company: string | null;
  country: string | null;
  province: string | null;
  start_date: Date | null;
  end_date: Date | null;
  resp: string | null;
  is_show_resp: boolean | null;
  learning_out: string | null;
  is_show_learning: boolean | null;
  reflection: string | null;
  is_show_reflec: boolean | null;
  attachments: {
    attachment_id: number;
    url: string | null;
    file_path: string | null;
    original_filename: string | null;
    file_size: number | null;
  }[];
}
