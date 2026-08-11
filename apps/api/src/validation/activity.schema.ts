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
const rubricLevel = z.object({
  level_no: z.int().positive(),
  description: blankableText,
});

const rubricCriterion = z.object({
  criteria: text,
  weight: z.number(),
  levels: z.array(rubricLevel),
});

/**
 * The same criterion on its way back in, carrying the id it was handed by
 * GET /activity — and so are its levels.
 *
 * The id is what tells an update which criterion a row is: with one, the row
 * already exists and is written over; without one, it is new. It is optional
 * because both are ordinary — a teacher adds a criterion as readily as they
 * edit one — and absent on every criterion the whole rubric is written afresh,
 * which is what every save did before #25.
 *
 * A level carries one for the same reason one level down. `level_no` used to
 * stand in for it, but it is a position and positions move: deleting a column
 * renumbers the ones under it, and a mark given at the old number came to read
 * as the level above (#39).
 */
const updatableRubricCriterion = rubricCriterion.extend({
  id: optionalId,
  levels: z.array(rubricLevel.extend({ id: optionalId })),
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
  rubric: jsonField(z.array(updatableRubricCriterion)),
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
export type UpdatableRubricDetail = z.infer<typeof updatableRubricCriterion>;
