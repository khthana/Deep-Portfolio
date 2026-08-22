import type { PortfolioSectionAttachment } from "./portfolio-attachment";

/**
 * Something the student took part in — `portfolio_activities`.
 *
 * Five endpoints and one shape: four answer the row with its attachments and
 * `DELETE` answers `data: null`.
 *
 * `name` is the one field in the six sections that the column refuses to leave
 * empty, so it is a plain string here while its neighbours are nullable.
 */
export type PortfolioActivityDetail = {
  id: number;
  user_id: string;
  name: string;
  date: string | null;
  role: string | null;
  description: string | null;
  is_show: boolean | null;
  attachments: PortfolioSectionAttachment[];
};
