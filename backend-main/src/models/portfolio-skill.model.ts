export type AssignWorkToSkillsReqBody = {
  user_id: string;
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

export type SkillMappingReqBody = {
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

export type CreatePortfolioSkillReqBody = {
  name?: string;
  mappings?: SkillMappingReqBody[];
};

export type UpdateSkillMappingReqBody = {
  id: number; // mapping row id to update
  student_activity_id?: number;
  repository?: string;
  role_and_resp?: string;
  init_expect?: string;
  reflection?: string;
  isShowRepo?: boolean;
  isShowRole?: boolean;
  isShowInit?: boolean;
  isShowReflec?: boolean;
};

export type UpdatePortfolioSkillReqBody = {
  name?: string;
  mappings?: UpdateSkillMappingReqBody[];
};

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
