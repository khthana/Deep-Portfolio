export type PortfolioPersonalResp = {
  user_id: string;
  date_of_birth?: string | null;
  nationality?: string | null;
  race?: string | null;
  github?: string | null;
  linkedin?: string | null;
  email?: string | null;
  phone_number?: string | null;
  attachment_id?: number | null;
  attachments?: {
    attachment_id: number;
    url?: string | null;
    file_path?: string | null;
  } | null;
};

export type UpsertPortfolioPersonalReq = {
  nationality?: string;
  race?: string;
  date_of_birth?: string | Date | null; // ISO string or Date object
  phone_number?: string;
  email?: string;
  github?: string;
  linkedin?: string;
  attachment_id?: number | null;
};
