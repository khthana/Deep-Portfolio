import { z } from "zod";
import { id } from "./fields";

/**
 * `/gradebook` — the marks for a whole section, read two ways round.
 *
 * Both endpoints take the section and nothing else, and neither used to check
 * it. The two answered a missing one differently, which is the reason to: on
 * `/per-student` the NaN reached `student_course.section_id`, which is NOT
 * NULL, and came back as a 500; on `/per-activity` it reached
 * `activities.section_id`, which is nullable, and came back as a 200 whose
 * `section_id` is null — a gradebook of the activities that belong to no
 * section at all.
 */
export const gradebookQuery = z.object({
  section_id: id,
});
