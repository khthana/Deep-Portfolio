export type AttachmentResp = {
  attachment_id: number;
  url: string | null;
  file_path: string | null;
  original_filename: string | null;
  file_size: number | null;
};

export type PortfolioTrainingResp = {
  id: number;
  user_id: string;
  year: number | null;
  country: string | null;
  organize: string | null;
  name: string | null;
  description: string | null;
  is_show: boolean | null;
  attachments: AttachmentResp[];
};

export type CreatePortfolioTrainingReq = {
  user_id: string;
  year?: number;
  country?: string;
  organize?: string;
  name?: string;
  description?: string;
  is_show?: boolean;
};

export type UpdatePortfolioTrainingReq = Partial<
  Omit<CreatePortfolioTrainingReq, "user_id">
> & {
  ids_to_delete?: number[];
};
