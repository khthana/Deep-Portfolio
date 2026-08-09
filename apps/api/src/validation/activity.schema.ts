import { z } from "zod";
import { uploadUrl } from "./attachments.schema";
import {
  blankableText,
  id,
  jsonField,
  jsonValue,
  optionalBool,
  optionalDate,
  optionalId,
  optionalInteger,
  text,
} from "./fields";

/** `/activity` — graded work: what a teacher sets and a student hands in for. */

/**
 * INDIVIDUAL or GROUP, in whichever case it was sent — shared with
 * `/learning-activity`, which says the same thing in its own column.
 *
 * The controller lower-cased this before storing it and the read endpoints
 * upper-case it again, so both spellings have always gone through; that is
 * kept. What is new is that a third word is refused — the column is a plain
 * VarChar, and the reads hand back whatever is in it as though it were one of
 * these two.
 */
export const classworkType = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
  z.enum(["INDIVIDUAL", "GROUP"]),
);

/**
 * One criterion of an activity's own rubric, with the levels to mark against.
 *
 * A level's description may be blank — a teacher who has written the top and
 * bottom of a scale and left the middle empty has still written a scale — but
 * a criterion with no name is nothing at all.
 */
const rubricCriterion = z.object({
  criteria: text,
  weight: z.number(),
  levels: z.array(
    z.object({
      level_no: z.int().positive(),
      description: blankableText,
    }),
  ),
});

/**
 * Multipart, so every field arrives as a string and the structured ones arrive
 * as JSON inside it.
 *
 * `is_average_score` and `is_self_assessment` are optional rather than
 * defaulted to false. They used to go through `parseBool`, which reads anything
 * that is not `"true"` as false — so an update that left one out silently
 * cleared it. Left out now, they are left alone.
 */
export const createActivityBody = z.object({
  activity_name: text,
  activity_type: classworkType,
  section_id: id,
  rubric: jsonField(z.array(rubricCriterion)),

  announcement_date: optionalDate,
  deadline_date: optionalDate,
  course_syllabus_id: optionalId,
  score_number: optionalInteger,
  score_ratio_id: optionalId,
  expected_level: optionalInteger,
  detail: jsonField(jsonValue.optional()),
  is_average_score: optionalBool,
  is_self_assessment: optionalBool,

  urls: jsonField(z.array(uploadUrl)).default([]),
});

export const updateActivityBody = createActivityBody.extend({
  activity_id: id,
  remove_attachment_ids: jsonField(z.array(id)).default([]),
});

export const activityQuery = z.object({
  activity_id: id,
});

export const activityListQuery = z.object({
  section_id: id,
});

export const studentActivityDetailQuery = z.object({
  student_activity_id: id,
});

export type CreateActivityBody = z.infer<typeof createActivityBody>;
export type UpdateActivityBody = z.infer<typeof updateActivityBody>;
export type AddRubricDetail = z.infer<typeof rubricCriterion>;
