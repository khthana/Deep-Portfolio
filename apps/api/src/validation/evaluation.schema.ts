import { z } from "zod";
import { id } from "./fields";

/**
 * `/evaluation/list` — what one student has been marked on in one section.
 *
 * The student is the session, so the section is the only thing the caller
 * names. A missing one used to get as far as the classroom-work half of the
 * answer before Postgres refused the NaN against a NOT NULL column.
 */
export const evaluationListQuery = z.object({
  section_id: id,
});
