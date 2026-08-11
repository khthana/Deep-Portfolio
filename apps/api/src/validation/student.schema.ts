import { z } from "zod";
import { classworkType } from "./activity.schema";
import { uploadUrl } from "./attachments.schema";
import { id, integer, jsonField, text } from "./fields";

/**
 * `/student` — what a student can read about their own studies, and the two
 * endpoints they hand work in through.
 *
 * Nothing here says which person any more. Since #40 and #41 the student comes
 * from the session on every read, so what is left to check is which section is
 * being asked about, and a `section_id` is compulsory wherever it appears: a
 * read that filters on an absent one does not answer about nobody, it answers
 * about everybody.
 *
 * Who may ask about a given section is not this file's question — that is
 * `requireOwnSection` and `requireEnrolledSection`, on the routes.
 */

/** A term, as the term-aware reads take it: a query string, not a foreign key. */
const term = {
  semester: integer,
  academic_year: text,
};

export const studentListQuery = z.object({
  section_id: id,
});

export const studentTermQuery = z.object(term);

export const studentClassworkListQuery = z.object({
  section_id: id,
});

/**
 * The section only. The student used to come from the query, and
 * `where: { student_id: undefined }` is not a filter that matches nothing but
 * no filter at all, so a caller who left it out was handed every student's
 * submission status for the section. Since #41 the student comes from the
 * session, which is the answer to both halves of that: nothing to leave out,
 * and nobody else's name to put in.
 */
export const sectionActivitiesQuery = z.object({
  section_id: id,
});

export const activityDetailsParams = z.object({
  student_activity_id: id,
});

/**
 * Handing work in. Multipart, so `urls` and `existing_files_ids` arrive as JSON
 * strings inside the form; the files themselves are multer's, not the schema's.
 */
const submission = {
  section_id: id,
  type: classworkType,
  group_id: id.optional(),

  urls: jsonField(z.array(uploadUrl)).default([]),
  existing_files_ids: jsonField(z.array(id)).default([]),
};

/**
 * A group submission has to name its group.
 *
 * Both group paths filter the members on it, and `group_id: undefined` is no
 * filter: one request without it marked every accepted member of every group in
 * the system SUBMITTED, gave them all the same attachments, set every group row
 * to SUBMITTED, and put the upload under `group-undefined`.
 */
function namesItsGroup(body: { type: string; group_id?: number }) {
  return body.type !== "GROUP" || body.group_id !== undefined;
}

const GROUP_ID_REQUIRED = {
  error: "ต้องระบุเมื่อส่งงานแบบกลุ่ม",
  path: ["group_id"],
};

export const submitActivityBody = z
  .object({
    ...submission,
    student_activity_id: id,
    activity_id: id,
  })
  .refine(namesItsGroup, GROUP_ID_REQUIRED);

export const submitLearningActivityBody = z
  .object({
    ...submission,
    student_learning_activity_id: id,
    learning_activity_id: id,
  })
  .refine(namesItsGroup, GROUP_ID_REQUIRED);

export type SubmitActivityFields = z.infer<typeof submitActivityBody>;
export type SubmitLearningActivityFields = z.infer<
  typeof submitLearningActivityBody
>;
