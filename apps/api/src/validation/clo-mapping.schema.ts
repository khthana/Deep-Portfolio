import { z } from "zod";
import { id, integer } from "./fields";

/**
 * `/mapping/activity` and `/mapping/learning-activity` — what a piece of work
 * measures.
 *
 * `sequence_order` is not here: the caller never sends it, the endpoint takes
 * the highest one already on the activity and adds one.
 *
 * `clo_id` is required on the reads as well as the writes. It is nullable on
 * both mapping tables, so a missing parameter used to be answered with the
 * mappings that point at no CLO at all — an empty list, indistinguishable from
 * a CLO that nothing measures.
 */

export const createActivityCLOMappingBody = z.object({
  activity_id: id,
  clo_id: id,
  weight: integer,
});

export const createLearningActivityCLOMappingBody = z.object({
  learning_activity_id: id,
  clo_id: id,
});

export const cloMappingQuery = z.object({
  clo_id: id,
});

export const validateActivityCLOMappingQuery = z.object({
  activity_id: id,
});

export type CreateActivityCLOMappingBody = z.infer<
  typeof createActivityCLOMappingBody
>;
export type CreateLearningActivityCLOMappingBody = z.infer<
  typeof createLearningActivityCLOMappingBody
>;
