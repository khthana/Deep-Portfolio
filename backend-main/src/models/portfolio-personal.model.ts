export type CreatePortfolioPersonalReqBody = {
  date_of_birth?: Date;
  nationality?: string;
  race?: string;
  github?: string;
  linkedin?: string;
  email?: string;
  phone_number?: string;
  attachment_id?: number;
};

export type UpdatePortfolioPersonalReqBody =
  Partial<CreatePortfolioPersonalReqBody>;

export type PortfolioPersonalResp = {
  user_id: string;
  date_of_birth: Date | null;
  nationality: string | null;
  race: string | null;
  github: string | null;
  linkedin: string | null;
  email: string | null;
  phone_number: string | null;
  attachment_id: number | null;
  attachments?: {
    attachment_id: number;
    url: string | null;
    file_path: string | null;
  } | null;
};
