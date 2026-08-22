import type { PortfolioSectionAttachment } from "./portfolio-attachment";

/**
 * A prize or a competition result — `portfolio_award`.
 *
 * Five endpoints and one shape: four answer the row with its attachments and
 * `DELETE` answers `data: null`.
 *
 * `name` is what was entered for, `award` is what was won. Both are nullable,
 * and so is everything else the student types.
 */
export type PortfolioAwardDetail = {
  id: number;
  user_id: string;
  organize: string | null;
  name: string | null;
  award: string | null;
  date: string | null;
  description: string | null;
  is_show: boolean | null;
  attachments: PortfolioSectionAttachment[];
};
