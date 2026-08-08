export type AttachmentResp = {
  attachment_id: number;
  url: string | null;
  file_path: string | null;
  original_filename: string | null;
  file_size: number | null;
};

export interface PortfolioInternshipResp {
  id: number;
  user_id: string;
  type: string;
  title: string | null;
  position: string | null;
  company: string | null;
  country: string | null;
  province: string | null;
  start_date: string | null;
  end_date: string | null;
  resp: string | null;
  is_show_resp: boolean | null;
  learning_out: string | null;
  is_show_learning: boolean | null;
  reflection: string | null;
  is_show_reflec: boolean | null;
  attachments: AttachmentResp[];
}

export interface CreatePortfolioInternshipReq {
  user_id: string;
  type: string;
  title?: string;
  position: string;
  company: string;
  country: string;
  province?: string;
  start_date?: string;
  end_date?: string;
  resp?: string;
  is_show_resp?: boolean;
  learning_out?: string;
  is_show_learning?: boolean;
  reflection?: string;
  is_show_reflec?: boolean;
}

export type UpdatePortfolioInternshipReq = Partial<
  Omit<CreatePortfolioInternshipReq, "user_id">
> & {
  ids_to_delete?: number[];
};
