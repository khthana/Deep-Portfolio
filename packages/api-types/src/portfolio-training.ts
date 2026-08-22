import type { PortfolioSectionAttachment } from "./portfolio-attachment";

/**
 * A course or workshop a student went to — `portfolio_training`.
 *
 * Five endpoints and one shape: the two reads, the create and the update all
 * answer the row with its attachments. `DELETE` answers `data: null` — the
 * service builds a row to hand back and the controller does not pass it on —
 * so it has no type here and is not missing one.
 *
 * `attachments` is not optional. Every endpoint that answers a row answers this
 * key too: the reads build it, the create and the update re-read through the
 * one that does, and it is an empty list when nothing is attached rather than
 * an absent key. The API's copy said optional and was wrong about all four
 * (#68).
 *
 * `year` is the Buddhist-era year as a plain integer, not a date.
 */
export type PortfolioTrainingDetail = {
  id: number;
  user_id: string;
  year: number | null;
  country: string | null;
  organize: string | null;
  name: string | null;
  description: string | null;
  is_show: boolean | null;
  attachments: PortfolioSectionAttachment[];
};
