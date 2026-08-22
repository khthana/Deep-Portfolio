import { axiosInstance } from "../lib/axios";
import { endpoints } from "../configs/endpoints.config";
import type { ResponseWrapper } from "../types/global-type";
import type {
  CreatePortfolioSkillReq,
  UpdatePortfolioSkillReq,
  AssignWorkToSkillsReq,
} from "../types/portfolio-skill-type.type";
import type {
  PortfolioSkillDetail,
  PortfolioWorkDetail,
  SkillMappingDetail,
} from "@deep-portfolio/api-types";

export const getAllPortfolioSkill = async (userId: string) => {
  const resp = await axiosInstance.get<ResponseWrapper<PortfolioSkillDetail[]>>(
    endpoints.portfolio_skill.root,
    { params: { user_id: userId } },
  );
  return resp.data;
};

export const getPortfolioWorks = async (userId: string) => {
  const resp = await axiosInstance.get<ResponseWrapper<PortfolioWorkDetail[]>>(
    endpoints.portfolio_skill.works,
    { params: { user_id: userId } },
  );
  return resp.data;
};

export const getPortfolioSkillById = async (id: number) => {
  const resp = await axiosInstance.get<ResponseWrapper<PortfolioSkillDetail>>(
    endpoints.portfolio_skill.detail(id),
  );
  return resp.data;
};

export const createPortfolioSkill = async (data: CreatePortfolioSkillReq) => {
  const resp = await axiosInstance.post<ResponseWrapper<PortfolioSkillDetail>>(
    endpoints.portfolio_skill.root,
    data,
  );
  return resp.data;
};

export const updatePortfolioSkill = async (
  id: number,
  data: UpdatePortfolioSkillReq,
) => {
  const resp = await axiosInstance.put<ResponseWrapper<PortfolioSkillDetail>>(
    endpoints.portfolio_skill.detail(id),
    data,
  );
  return resp.data;
};

export const deletePortfolioSkill = async (id: number) => {
  // `data: null`, not the skill: the service builds a row for its caller and
  // the controller does not pass it on (#68).
  const resp = await axiosInstance.delete<ResponseWrapper<null>>(
    endpoints.portfolio_skill.detail(id),
  );
  return resp.data;
};

export const getPortfolioSkillMappingById = async (id: number) => {
  // Was `any` until #68, because neither side had a name for what this
  // answers: the mapping row with the skill it hangs off nested inside it.
  const resp = await axiosInstance.get<ResponseWrapper<SkillMappingDetail>>(
    endpoints.portfolio_skill.mapping(id),
  );
  return resp.data;
};

export const assignWorkToSkills = async (data: AssignWorkToSkillsReq) => {
  const resp = await axiosInstance.post<ResponseWrapper<null>>(
    endpoints.portfolio_skill.assign_work,
    data,
  );
  return resp.data;
};

export const deleteSkillMapping = async (mappingId: number) => {
  const resp = await axiosInstance.delete<ResponseWrapper<null>>(
    endpoints.portfolio_skill.deleteMapping(mappingId),
  );
  return resp.data;
};
