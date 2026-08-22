/**
 * The personal details of one student — `portfolio_personal`.
 *
 * One row per user: `user_id` is the primary key rather than a foreign key,
 * which is why this is the only part of the e-Portfolio with an upsert.
 *
 * Five endpoints and two shapes here, plus one that gets no type.
 * `GET /portfolio-personal/:user_id` answers `PortfolioPersonalDetail` — the
 * row with the profile picture read back beside it. `POST`, `PUT` and the
 * upsert answer `PortfolioPersonalRow`: what Prisma handed back, which carries
 * no `attachments` key at all, because the picture is something the read goes
 * and fetches (ADR-0033, and pinned with `not.toHaveProperty`). `DELETE`
 * answers `data: null` — the service hands the row it removed back to the
 * controller and the controller does not pass it on, so there is nothing here
 * to name.
 *
 * `email` and `phone_number` are the odd pair. The columns are the student's
 * own copy, and the read falls back to the account row when they are empty —
 * so a caller can see a value here that is not in this table. A write answers
 * the column, fallback and all not applied.
 */

/**
 * The row itself, as the four writes answer it.
 *
 * `date_of_birth` is a `date` column and arrives as a string, the way every
 * date does — the web already said so; the API's own copy said `Date` (#68).
 */
export type PortfolioPersonalRow = {
  user_id: string;
  date_of_birth: string | null;
  nationality: string | null;
  race: string | null;
  github: string | null;
  linkedin: string | null;
  email: string | null;
  phone_number: string | null;
  attachment_id: number | null;
};

/**
 * The profile picture, as the read hands it over.
 *
 * Not `AttachmentDetailResp`: the row holds one picture rather than a list, and
 * the two fields say different things depending on where it is kept — a stored
 * file puts its path in both `url` and `file_path`, a link puts the link in
 * `url` and leaves `file_path` null.
 */
export type PortfolioPersonalPicture = {
  attachment_id: number;
  url: string | null;
  file_path: string | null;
};

/**
 * `GET /portfolio-personal/:user_id` — the row plus the picture it points at.
 *
 * `attachments` is null when the row names no picture, and also when it names
 * one that no longer has a file or a link behind it.
 *
 * `email` narrows to a plain string here, which is the one field where the read
 * knows more than the row does: `users.email` is `@unique` and non-null, both
 * branches of the read fall back to it, so this endpoint cannot answer null.
 * `phone_number` does not narrow — `users.phone` is nullable, so the fallback
 * can hand back null of its own.
 */
export type PortfolioPersonalDetail = PortfolioPersonalRow & {
  email: string;
  attachments: PortfolioPersonalPicture | null;
};
