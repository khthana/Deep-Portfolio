import type {
  AssignWorkToSkillsFields,
  CreatePortfolioSkillFields,
  SkillMappingFields,
  UpdatePortfolioSkillFields,
} from "../validation/portfolio-skill.schema";

export type AssignWorkToSkillsReqBody = AssignWorkToSkillsFields;

export type SkillMappingReqBody = SkillMappingFields;

export type CreatePortfolioSkillReqBody = Omit<
  CreatePortfolioSkillFields,
  "user_id"
>;

/**
 * The update takes the same mapping shape as the create.
 *
 * It used to declare a row `id` and an optional `student_activity_id`, as if it
 * edited the rows in place. It never has: the handler deletes this skill's
 * mappings and writes the list again, so an `id` would be ignored and a mapping
 * with no work behind it would be a row pointing at submission `undefined`.
 */
export type UpdatePortfolioSkillReqBody = UpdatePortfolioSkillFields;

export type SkillMappingResp = {
  id: number;
  skill_id: number;
  student_activity_id: number;
  repository: string | null;
  role_and_resp: string | null;
  init_expect: string | null;
  reflection: string | null;
  isShowRepo: boolean | null;
  isShowRole: boolean | null;
  isShowInit: boolean | null;
  isShowReflec: boolean | null;
};

export type PortfolioSkillResp = {
  id: number;
  user_id: string;
  name: string | null;
  mappings?: SkillMappingResp[];
};

export type PortfolioWorkResp = {
  student_activity_id: number;
  mapping_ids: number[];
  skills: { id: number; name: string | null }[];
  repository: string | null;
  role_and_resp: string | null;
  init_expect: string | null;
  reflection: string | null;
  isShowRepo: boolean;
  isShowRole: boolean;
  isShowInit: boolean;
  isShowReflec: boolean;
  feedback: string | null;
};
