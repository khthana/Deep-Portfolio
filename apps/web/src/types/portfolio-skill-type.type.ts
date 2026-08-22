// SkillMappingResp, PortfolioSkillResp and PortfolioWorkResp used to be
// declared here. They moved to @deep-portfolio/api-types (#68) as
// `SkillMapping`, `PortfolioSkillDetail` and `PortfolioWorkDetail` — import
// them from there. `mappings` was optional on both sides, and every endpoint
// that answers a skill answers that key.

export type SkillMappingReq = {
  student_activity_id: number;
  repository?: string;
  role_and_resp?: string;
  init_expect?: string;
  reflection?: string;
  isShowRepo?: boolean;
  isShowRole?: boolean;
  isShowInit?: boolean;
  isShowReflec?: boolean;
};

export type CreatePortfolioSkillReq = {
  name: string;
  mappings?: SkillMappingReq[];
};

export type UpdatePortfolioSkillReq = {
  name?: string;
  mappings?: SkillMappingReq[];
};

export type AssignWorkToSkillsReq = {
  student_activity_id: number;
  skill_ids: number[];
  repository?: string;
  role_and_resp?: string;
  init_expect?: string;
  reflection?: string;
  isShowRepo?: boolean;
  isShowRole?: boolean;
  isShowInit?: boolean;
  isShowReflec?: boolean;
};
