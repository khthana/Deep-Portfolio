import type { PortfolioPersonalFields } from "../validation/portfolio-personal.schema";

/**
 * Create and update take the same fields.
 *
 * They always have — whose row it is arrives beside the fields rather than
 * among them, from the session since #31 — but the declared types
 * said every field was optional, which is what let the service treat `""` and
 * the string `"null"` as values worth a runtime pass of their own. Every field
 * here is `T | null | undefined`: sent, sent empty, or not sent.
 */
export type CreatePortfolioPersonalReqBody = PortfolioPersonalFields;

export type UpdatePortfolioPersonalReqBody = PortfolioPersonalFields;

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
