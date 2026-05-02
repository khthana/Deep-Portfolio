export type CreatePortfolioActivityReqBody = {
  name: string;
  date?: string;
  role?: string;
  description?: string;
  is_show?: boolean;
};

export type UpdatePortfolioActivityReqBody =
  Partial<CreatePortfolioActivityReqBody> & {
    ids_to_delete?: number[];
  };

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
