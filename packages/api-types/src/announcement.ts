import type { AttachmentDetailResp } from "./attachment";

/**
 * A section's noticeboard — what a teacher posts and every student in the
 * section reads.
 *
 * Three endpoints, and only two shapes between them: the feed answers the row,
 * `POST` answers the id of what it created, and `/:id/attachments` answers
 * `AttachmentDetailResp` as its `data` and adds nothing of its own, so it needs
 * no name here at all. That last one is the opposite of `GET
 * /student-activity/attachments`, which calls the same service and then flattens
 * the result into a shape of its own (ADR-0034).
 */

/** `announcements.status`. Lower case, because the enum in the database is —
 *  these are the labels Postgres holds, not a convention this package chose.
 *
 *  Nothing writes the column. `POST /announcement` does not set it and there is
 *  no default behind it, so every row the system has ever created reads null,
 *  which is what the case pinning this shape asserts. The three names are here
 *  because the column admits them, not because a caller has seen one. */
export type AnnouncementStatus = "draft" | "published" | "archived";

/**
 * `GET /announcement` — one post on the feed.
 *
 * The service spreads the whole Prisma row and hangs the attachments off it, so
 * `section_id` is on the wire beside the nine columns the card shows. Both
 * sides used to declare ten fields and cover the eleventh with an `as` over the
 * whole object (#68).
 *
 * `content` is the rich-text editor's own document, and the API has never
 * looked inside it — `unknown` here, the same as `detail` on the two kinds of
 * classwork. The card that renders it is the only thing that knows it is a
 * tiptap `JSONContent`, and it is the one place that says so.
 *
 * `attachments` is never null: the service calls the attachment reader for
 * every row, and that reader answers `{ file: [], url: [] }` when there is
 * nothing to find rather than nothing at all.
 */
export type AnnouncementDetailResp = {
  announcement_id: number;
  title: string;
  content: unknown;
  created_by: string;
  created_at: string | null;
  updated_at: string | null;
  published_at: string | null;
  status: AnnouncementStatus | null;
  is_pinned: boolean | null;
  view_count: number | null;
  section_id: number;
  attachments: AttachmentDetailResp;
};

/**
 * `POST /announcement` — the id of the post that was created.
 *
 * One id even when the request fanned out: `all_section` posts a row to every
 * section of the course the teacher teaches, and what comes back is the first
 * of them (ADR-0002 for whose sections those are).
 *
 * Nothing reads it. The one caller checks `success`, shows a message and
 * navigates to the feed, which fetches itself. It has a name anyway because a
 * reader has to know the key to get the value out, which is the line ADR-0036
 * draws — the same reason `GroupIdResp` has one and `POST /score-weight`, which
 * answers a bare number, does not.
 */
export type AnnouncementIdResp = {
  announcement_id: number;
};
