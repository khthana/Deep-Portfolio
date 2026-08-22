import type { PortfolioSectionAttachment } from "./portfolio-attachment";

/**
 * A certificate a student holds — `portfolio_certificate`.
 *
 * Five endpoints and one shape, the same as every other section: four answer
 * the row with its attachments and `DELETE` answers `data: null`.
 *
 * `date` is a `date` column and arrives as a string. The API's copy said
 * `Date`, which is what Prisma holds rather than what a caller reads (#68).
 */
export type PortfolioCertificateDetail = {
  id: number;
  user_id: string;
  date: string | null;
  organize: string | null;
  name: string | null;
  description: string | null;
  is_show: boolean | null;
  attachments: PortfolioSectionAttachment[];
};
