import { z } from "zod";
import { id, text } from "./fields";

/** `/rubric` — the programme's shared rubrics, read-only. */

/**
 * `program_id` is required. A findMany reads `program_id: undefined` as "do not
 * filter on this column", so the parameter being absent widened the query to
 * every programme in the university instead of narrowing it to one — the same
 * shape as GET /course/plo/list.
 */
export const sharedRubricQuery = z.object({
  program_id: text,
});

export const sharedRubricDetailQuery = z.object({
  rubric_id: id,
});
