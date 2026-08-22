import type {
  AssignWorkToSkillsFields,
  CreatePortfolioSkillFields,
  SkillMappingFields,
  UpdatePortfolioSkillFields,
} from "../validation/portfolio-skill.schema";

export type AssignWorkToSkillsReqBody = AssignWorkToSkillsFields;

export type SkillMappingReqBody = SkillMappingFields;

export type CreatePortfolioSkillReqBody = CreatePortfolioSkillFields;

/**
 * The update takes the same mapping shape as the create.
 *
 * It used to declare a row `id` and an optional `student_activity_id`, as if it
 * edited the rows in place. It never has: the handler deletes this skill's
 * mappings and writes the list again, so an `id` would be ignored and a mapping
 * with no work behind it would be a row pointing at submission `undefined`.
 */
export type UpdatePortfolioSkillReqBody = UpdatePortfolioSkillFields;

// SkillMappingResp, PortfolioSkillResp and PortfolioWorkResp used to be
// declared here. They moved to @deep-portfolio/api-types (#68) as
// `SkillMapping`, `PortfolioSkillDetail` and `PortfolioWorkDetail` — import
// them from there. Two things they said that the endpoints do not: `mappings`
// was optional, where every endpoint answering a skill answers that key; and
// `GET /portfolio-skill/mapping/:id` had no type at all on either side, which
// is now `SkillMappingDetail`.
