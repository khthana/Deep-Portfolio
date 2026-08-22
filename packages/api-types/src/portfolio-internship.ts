import type { PortfolioSectionAttachment } from "./portfolio-attachment";

/**
 * A placement or a co-operative term — `portfolio_internship`.
 *
 * Five endpoints and one shape: four answer the row with its attachments and
 * `DELETE` answers `data: null`.
 *
 * `type` says which of the two it was and the column refuses null, the same as
 * the activity's name. Three `is_show_*` flags cover the three long-form
 * answers below them, and both dates arrive as strings.
 *
 * This is the one section whose API copy already said `attachments` was always
 * there. The other five said optional; this one was right (#68).
 */
export type PortfolioInternshipDetail = {
  id: number;
  user_id: string;
  type: string;
  title: string | null;
  position: string | null;
  company: string | null;
  country: string | null;
  province: string | null;
  start_date: string | null;
  end_date: string | null;
  resp: string | null;
  is_show_resp: boolean | null;
  learning_out: string | null;
  is_show_learning: boolean | null;
  reflection: string | null;
  is_show_reflec: boolean | null;
  attachments: PortfolioSectionAttachment[];
};
