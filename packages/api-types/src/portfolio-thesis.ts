import type { PortfolioSectionAttachment } from "./portfolio-attachment";

/**
 * The student's project — `portfolio_thesis`.
 *
 * Five endpoints and one shape: four answer the row with its attachments and
 * `DELETE` answers `data: null`.
 *
 * Four `is_show_*` flags rather than one, because the sections of a thesis are
 * shown and hidden separately. All four are nullable columns with a default of
 * true; the web declared them plain booleans, and `name` a plain string, where
 * the column takes null (#68).
 */
export type PortfolioThesisDetail = {
  id: number;
  user_id: string;
  name: string | null;
  repository: string | null;
  role_and_resp: string | null;
  init_expect: string | null;
  reflection: string | null;
  is_show_repo: boolean | null;
  is_show_role: boolean | null;
  is_show_init: boolean | null;
  is_show_reflec: boolean | null;
  attachments: PortfolioSectionAttachment[];
};
