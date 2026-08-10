import { z } from "zod";
import { blankableText, id, optionalBool } from "./fields";

/**
 * `/portfolio-skill` — the skills a student claims, and the submitted work each
 * one is evidenced by.
 *
 * A skill is a name and nothing else. What carries the content is the mapping
 * between a skill and one piece of marked work: the repository, what the
 * student's part in it was, what they expected going in, what they made of it
 * afterwards, and a flag per field saying which of the four to show. The same
 * four-and-four appear twice, because a mapping can be written either from the
 * skill's side (`POST /`, `PUT /:id`) or from the work's side
 * (`POST /assign-work`), so they are described once here.
 */

const evidence = {
  repository: blankableText.optional(),
  role_and_resp: blankableText.optional(),
  init_expect: blankableText.optional(),
  reflection: blankableText.optional(),
  isShowRepo: optionalBool,
  isShowRole: optionalBool,
  isShowInit: optionalBool,
  isShowReflec: optionalBool,
};

/**
 * `student_activity_id` is what the mapping is for, so it is required on the
 * way in whichever side writes it — including the update, whose declared type
 * had it optional even though the handler deletes every mapping and writes the
 * list again from scratch. A mapping with no work behind it would be a row
 * pointing at submission `undefined`.
 */
const skillMapping = z.object({ student_activity_id: id, ...evidence });

const skill = {
  name: blankableText.optional(),

  /**
   * Sending the list is what replaces it; leaving it out is what keeps it. An
   * empty list therefore means "take the work off this skill" and is not the
   * same as saying nothing.
   */
  mappings: z.array(skillMapping).optional(),
};

export const createPortfolioSkillBody = z.object(skill);
export const updatePortfolioSkillBody = z.object(skill);

/**
 * Mapping one piece of work onto skills, from the work's side.
 *
 * The list may not be empty. The handler wipes this student's mappings for the
 * submission before writing the new ones, so an empty list would read as "unmap
 * it", which is what DELETE /mapping/:id is for — and a caller who sent an
 * empty list by accident would get silence rather than a refusal.
 */
export const assignWorkToSkillsBody = z.object({
  student_activity_id: id,
  skill_ids: z.array(id).min(1),
  ...evidence,
});

export type CreatePortfolioSkillFields = z.infer<
  typeof createPortfolioSkillBody
>;
export type UpdatePortfolioSkillFields = z.infer<
  typeof updatePortfolioSkillBody
>;
export type SkillMappingFields = z.infer<typeof skillMapping>;
export type AssignWorkToSkillsFields = z.infer<typeof assignWorkToSkillsBody>;
