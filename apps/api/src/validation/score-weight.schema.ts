import { z } from "zod";
import { decimal, id, text } from "./fields";

/** `/score-weight` — a section's score categories and what each is worth. */

export const scoreWeightQuery = z.object({
  section_id: id,
});

/**
 * `sequence_order` and `created_by` are not here on purpose. The frontend sends
 * both and the service reads neither: the order is the section's highest plus
 * one, computed on the server, and the author is never written. Unknown fields
 * are dropped rather than refused, so those requests keep working — naming them
 * here would only claim they mean something.
 */
export const addScoreWeightBody = z.object({
  score_category: text,
  weight: decimal,
  section_id: id,
});

export const updateScoreWeightBody = z.object({
  score_id: id,
  score_category: text,
  weight: decimal,
});

export const deleteScoreWeightQuery = z.object({
  scoreId: id,
});

export type AddScoreWeightBody = z.infer<typeof addScoreWeightBody>;
export type UpdateScoreWeightBody = z.infer<typeof updateScoreWeightBody>;
