export type AttachmentResp = {
  attachment_id: number;
  url: string | null;
  file_path: string | null;
  original_filename: string | null;
  file_size: number | null;
};

export type PortfolioAwardResp = {
  id: number;
  user_id: string;
  organize: string | null;
  name: string | null;
  award: string | null;
  date: Date | null;
  description: string | null;
  is_show: boolean | null;
  attachments: AttachmentResp[];
};

export type CreatePortfolioAwardReq = {
  organize?: string;
  name?: string;
  award?: string;
  date?: string;
  description?: string;
  is_show?: boolean;
};

export type UpdatePortfolioAwardReq = Partial<CreatePortfolioAwardReq> & {
  ids_to_delete?: number[];
};
