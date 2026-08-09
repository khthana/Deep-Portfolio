import { z } from "zod";
import { id, optionalText, optionalUserId, text } from "./fields";

/**
 * `/lesson-plan` — the weekly plan of a section.
 *
 * `year`, `semester` and `subject_id` are not here. The frontend sends all
 * three when it adds a week and the service reads none of them: a week hangs
 * off a section, and the section already knows its term and its subject.
 * Unknown fields are dropped rather than refused, so those requests keep
 * working unchanged.
 */

/** A week number: a positive integer, for the same reason an id is one. */
const weekNumber = id;

export const lessonPlanQuery = z.object({
  section_id: id,
});

/**
 * `section_id` is required even though the column is nullable. Every endpoint
 * that reads a week filters by section, so a week written without one can
 * never be read back — it is not an unattached week, it is a lost one.
 *
 * `created_by` stays optional: the column is nullable, and nothing but the
 * delete used to read it. Requiring it would refuse requests the system has
 * always accepted, which is a decision about ownership — see #25–#31.
 */
export const addLessonPlanBody = z.object({
  week_no: weekNumber,
  title: text,
  description: optionalText,
  remark: optionalText,
  created_by: optionalUserId,
  section_id: id,
});

/**
 * No `week_no`: an update changes what a week says, not where it sits. Moving
 * a week is what the delete's renumbering does, and there is no endpoint that
 * reorders one on request.
 */
export const updateLessonPlanBody = z.object({
  lesson_plan_id: id,
  title: text,
  description: optionalText,
  remark: optionalText,
});

export const deleteLessonPlanQuery = z.object({
  lesson_plan_id: id,
});

export type AddLessonPlanBody = z.infer<typeof addLessonPlanBody>;
export type UpdateLessonPlanBody = z.infer<typeof updateLessonPlanBody>;
