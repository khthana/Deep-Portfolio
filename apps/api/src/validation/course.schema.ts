import { z } from "zod";
import { id, integer, optionalId, optionalUserId, text } from "./fields";

/**
 * `/course` — the section itself, its schedule, and its CLOs and PLOs.
 *
 * A field is required here when the endpoint could not do its job without it,
 * and optional when the code already copes. `created_by` is the recurring
 * example: several tables have the column, the frontend sends it, and the
 * service writing the row has the assignment commented out. Making it required
 * would refuse requests the system has always accepted, which is a decision
 * about ownership rather than about input — see #25–#31.
 */

export const teacherCourseListQuery = z.object({
  academic_year: text,
  semester: integer,
});

export const courseDetailQuery = z.object({
  section_id: id,
});

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

/**
 * `HH:MM`, the shape the `time` columns are read and written as.
 *
 * `.refine` rather than `.regex`, because a refinement carries its own message
 * through to the caller and a regex failure does not — Zod reports that as a
 * format issue, and the only thing the translation layer can say about a format
 * it has no name for is "the format is wrong".
 */
const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d$/;
const timeOfDay = z.string().refine((value) => TIME_OF_DAY.test(value), {
  error: "ต้องเป็นเวลาตามรูปแบบ HH:MM",
});

export const createScheduleBody = z.object({
  section_id: id,
  day_of_week: z.enum(WEEKDAYS),
  start_time: timeOfDay,
  end_time: timeOfDay,
  classroom: text,
});

export const cloQuery = z.object({
  section_id: id,
});

export const addCLOBody = z.object({
  clo_number: text,
  clo_detail: text,
  /** Nullable in the schema, and the service copes: a CLO can be added before
   *  anyone has decided which programme outcome it serves. */
  plo_id: optionalId,
  section_id: id,
  created_by: optionalUserId,
});

export const updateCLOBody = z.object({
  id,
  clo_detail: text,
  plo_id: optionalId,
});

export const deleteCLOQuery = z.object({
  clo_id: id,
});

/**
 * Required, where before it was merely usually sent. A findMany reads
 * `program_id: undefined` as "do not filter on this column", so the parameter
 * being absent widened the query to every programme in the university instead
 * of narrowing it to one — the same shape as GET /rubric/shared-rubric.
 */
export const ploListQuery = z.object({
  program_id: text,
});

export type CreateCourseSectionScheduleReq = z.infer<typeof createScheduleBody>;
export type AddCLOBody = z.infer<typeof addCLOBody>;
export type UpdateCLOBody = z.infer<typeof updateCLOBody>;
