import { z } from "zod";
import { uploadUrl } from "./attachments.schema";
import { bool, id, jsonField, jsonValue, text, userId } from "./fields";

/** `/announcement` — the section's noticeboard. */

export const announcementQuery = z.object({
  section_id: id,
});

export const announcementAttachmentsParams = z.object({
  id,
});

/**
 * Multipart, so every field below arrives as a string and the structured ones
 * arrive as JSON inside it. `content` and `all_section` went through
 * `JSON.parse` unguarded, which made a request that left either out a
 * SyntaxError — a 500 quoting a position in a string the caller cannot see.
 */
export const createAnnouncementBody = z.object({
  title: text,
  // `announcements.content` is NOT NULL, so the one JSON value it cannot hold
  // is a literal null — which is what `jsonValue` already excludes.
  content: jsonField(jsonValue),
  /**
   * Required, unlike the `created_by` on a CLO: `announcements.created_by` is
   * NOT NULL with no default, so a post without one was never stored — it
   * reached Postgres and came back as a 500.
   */
  created_by: userId,
  section_id: id,
  urls: jsonField(z.array(uploadUrl)).default([]),
  all_section: bool,
});

export type CreateAnnouncementBody = z.infer<typeof createAnnouncementBody>;
