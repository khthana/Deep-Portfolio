import { z } from "zod";
import { uploadUrl } from "./attachments.schema";
import { id, jsonField } from "./fields";

/** `/course-material` — the slides, recordings and links hung off one week. */

export const courseMaterialQuery = z.object({
  section_id: id,
});

/**
 * Multipart: the files arrive as files, and each list of links arrives as a
 * JSON string beside them. Both lists default to empty, because a request that
 * uploads only files sends neither — that is what the controller's
 * `req.body.lecture_urls ? JSON.parse(...) : []` used to say, minus the 500
 * when the string was there but malformed.
 *
 * `section_id` is only the first half of the object key the upload is stored
 * under; the week is the other half. Neither can be missing without the file
 * landing somewhere nothing will look for it.
 */
export const createCourseMaterialBody = z.object({
  course_syllabus_id: id,
  section_id: id,
  lecture_urls: jsonField(z.array(uploadUrl)).default([]),
  record_urls: jsonField(z.array(uploadUrl)).default([]),
});

export const deleteCourseMaterialQuery = z.object({
  attachment_id: id,
});
