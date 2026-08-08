import type { Prisma } from "@prisma/client";
import prisma from "../../src/config/prisma";

/**
 * Announcements — what a teacher posts to a section's feed.
 *
 * `content` is a JSON column because the frontend edits it with a rich-text
 * editor and stores the editor's document, not a string. Nothing on the API
 * side looks inside it, so a case that is not about the content can leave the
 * default alone.
 *
 * Attachments are linked through announcement_attachments; pass ids from the
 * attachment factories to attach some.
 */

export interface AnnouncementOptions {
  /** course_sections.section_id. No foreign key on this column. */
  section_id: number;
  title?: string;
  content?: Prisma.InputJsonValue;
  /** users.user_id. Also no foreign key — the column is a plain VarChar(8). */
  created_by?: string;
  /** The feed is ordered by this, newest first, so a case about order has to
   *  say when each announcement was last touched. */
  updated_at?: Date;
  /** attachments.attachment_id, in the order they should be linked. */
  attachment_ids?: number[];
}

export async function createAnnouncement(options: AnnouncementOptions) {
  const announcement = await prisma.announcements.create({
    data: {
      section_id: options.section_id,
      title: options.title ?? "ประกาศตัวอย่าง",
      content: options.content ?? { text: "เนื้อหาประกาศตัวอย่าง" },
      created_by: options.created_by ?? "70000000",
      updated_at: options.updated_at,
    },
  });

  if (options.attachment_ids?.length) {
    await prisma.announcement_attachments.createMany({
      data: options.attachment_ids.map((attachment_id) => ({
        announcement_id: announcement.announcement_id,
        attachment_id,
      })),
    });
  }

  return announcement;
}
