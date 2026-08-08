export type PortfolioActivityAttachment = {
  attachment_id: number;
  url: string | null;
  file_path: string | null;
  original_filename: string | null;
  file_size: number | null;
};

export type PortfolioActivityResp = {
  id: number;
  user_id: string;
  name: string;
  date: string | null;
  role: string | null;
  description: string | null;
  is_show: boolean | null;
  attachments: PortfolioActivityAttachment[];
};

export type CreatePortfolioActivityReq = {
  user_id: string;
  name: string;
  date?: string;
  role?: string;
  description?: string;
  is_show?: boolean;
};

export type UpdatePortfolioActivityReq = {
  name?: string;
  date?: string;
  role?: string;
  description?: string;
  is_show?: boolean;
  ids_to_delete?: number[];
};
