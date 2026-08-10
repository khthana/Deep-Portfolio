import { z } from "zod";
import { uploadUrl } from "./attachments.schema";
import { bool, id, jsonField, jsonValue, text } from "./fields";

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
   * No `created_by`. `announcements.created_by` is NOT NULL, so a post has to
   * carry an author, but the author is the teacher who is posting — the
   * controller reads it off the session. A field here would be a second answer
   * to a question the session has already answered, and the caller would win
   * it (#30, ADR-0002).
   */
  section_id: id,
  urls: jsonField(z.array(uploadUrl)).default([]),
  all_section: bool,
});

export type CreateAnnouncementBody = z.infer<typeof createAnnouncementBody>;
