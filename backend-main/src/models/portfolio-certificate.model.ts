export type CreatePortfolioCertificateReqBody = {
  date?: string; // Expecting ISO string or similar from frontend for Date
  organize?: string;
  name?: string;
  description?: string;
  is_show?: boolean;
};

export type UpdatePortfolioCertificateReqBody =
  Partial<CreatePortfolioCertificateReqBody> & {
    ids_to_delete?: number[];
  };

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
