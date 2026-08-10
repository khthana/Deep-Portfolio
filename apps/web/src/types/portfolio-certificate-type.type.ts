export type AttachmentResp = {
  attachment_id: number;
  url: string | null;
  file_path: string | null;
  original_filename: string | null;
  file_size: number | null;
};

export type PortfolioCertificateResp = {
  id: number;
  user_id: string;
  date: Date | null;
  organize: string | null;
  name: string | null;
  description: string | null;
  is_show: boolean | null;
  attachments: AttachmentResp[];
};

export type CreatePortfolioCertificateReq = {
  date?: string;
  organize?: string;
  name?: string;
  description?: string;
  is_show?: boolean;
};

export type UpdatePortfolioCertificateReq =
  Partial<CreatePortfolioCertificateReq> & {
    ids_to_delete?: number[];
  };
