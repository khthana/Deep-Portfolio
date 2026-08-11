import { z } from "zod";
import { classworkType } from "./activity.schema";
import { uploadUrl } from "./attachments.schema";
import { id, integer, jsonField, text, userId } from "./fields";

/**
 * `/student` — what a student can read about their own studies, and the two
 * endpoints they hand work in through.
 *
 * The reads split down the middle by where the student comes from. Five take
 * them from the session and are about *me*; three take a `student_id` or a
 * `section_id` from the query and will answer about anybody. Validation does
 * not change that — who may ask is #41's question now — but it does make the
 * parameter compulsory, because a read that filters on an absent one does not
 * answer about nobody, it answers about everybody.
 *
 * The half that is about *me* has no schema here at all: since #40 nothing in
 * it takes a parameter that says which person, so there is nothing to check.
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
 * `where: { student_id: undefined }` is not a filter that matches nothing, it is
 * no filter at all — so leaving this out hands back every student's submission
 * status for the section rather than one student's. This route still takes the
 * student from the query because a teacher opens it to read somebody else's
 * work; who may do that is #41's question, and until it is answered this schema
 * is the only thing standing here.
 */
export const sectionActivitiesQuery = z.object({
  section_id: id,
  student_id: userId,
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
