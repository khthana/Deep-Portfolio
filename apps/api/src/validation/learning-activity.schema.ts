import { z } from "zod";
import { classworkType } from "./activity.schema";
import { uploadUrl } from "./attachments.schema";
import {
  id,
  jsonField,
  jsonValue,
  optionalDate,
  optionalId,
  text,
} from "./fields";

/**
 * `/learning-activity` — classroom work that is not marked.
 *
 * The same shape as an activity minus everything about scoring: no rubric, no
 * weight, no expected level. `section_id` is NOT NULL on this table, where on
 * `activities` it is merely necessary.
 */

export const createLearningActivityBody = z.object({
  learning_activity_name: text,
  learning_activity_type: classworkType,
  section_id: id,

  announcement_date: optionalDate,
  deadline_date: optionalDate,
  course_syllabus_id: optionalId,
  detail: jsonField(jsonValue.optional()),

  urls: jsonField(z.array(uploadUrl)).default([]),
});

export const updateLearningActivityBody = createLearningActivityBody.extend({
  learning_activity_id: id,
  remove_attachment_ids: jsonField(z.array(id)).default([]),
});

export const learningActivityQuery = z.object({
  learning_activity_id: id,
});

export const learningActivityListQuery = z.object({
  section_id: id,
});

export const studentLearningActivityDetailQuery = z.object({
  student_learning_activity_id: id,
});

export type CreateLearningActivityBody = z.infer<
  typeof createLearningActivityBody
>;
export type UpdateLearningActivityBody = z.infer<
  typeof updateLearningActivityBody
>;
