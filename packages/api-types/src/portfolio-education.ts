/**
 * A student's schooling — `portfolio_education`, one row per place studied.
 *
 * Five endpoints and one shape between them: the two reads, the create and the
 * update all answer the row. `DELETE` answers `data: null` — the service reads
 * the row it removed, and the controller does not pass it on — so it has no
 * type here and is not missing one.
 *
 * `gpa` is the field worth knowing about. The column is `Decimal(3,2)`, which
 * Prisma hands over as a `Decimal` object and `JSON.stringify` would have
 * written as a string; the service converts it to a number before answering, so
 * a caller reads a number and both sides say so (#16).
 */
export type PortfolioEducationDetail = {
  id: number;
  user_id: string;
  education_level: string;
  institution: string | null;
  start_year: number | null;
  end_year: number | null;
  country: string | null;
  gpa: number | null;
  study_plan: string | null;
  faculty: string | null;
  major: string | null;
  is_show: boolean | null;
};
