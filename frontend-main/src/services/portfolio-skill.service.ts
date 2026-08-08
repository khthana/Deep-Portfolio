import { axiosInstance } from "../lib/axios";
import { endpoints } from "../configs/endpoints.config";
import type { ResponseWrapper } from "../types/global-type";
import type {
  PortfolioSkillResp,
  CreatePortfolioSkillReq,
  UpdatePortfolioSkillReq,
  AssignWorkToSkillsReq,
  PortfolioWorkResp,
} from "../types/portfolio-skill-type.type";

export const getAllPortfolioSkill = async (userId: string) => {
  const resp = await axiosInstance.get<ResponseWrapper<PortfolioSkillResp[]>>(
    endpoints.portfolio_skill.root,
    { params: { user_id: userId } },
  );
  return resp.data;
};

export const getPortfolioWorks = async (userId: string) => {
  const resp = await axiosInstance.get<ResponseWrapper<PortfolioWorkResp[]>>(
    endpoints.portfolio_skill.works,
    { params: { user_id: userId } },
  );
  return resp.data;
};

export const getPortfolioSkillById = async (id: number) => {
  const resp = await axiosInstance.get<ResponseWrapper<PortfolioSkillResp>>(
    endpoints.portfolio_skill.detail(id),
  );
  return resp.data;
};

export const createPortfolioSkill = async (data: CreatePortfolioSkillReq) => {
  const resp = await axiosInstance.post<ResponseWrapper<PortfolioSkillResp>>(
    endpoints.portfolio_skill.root,
    data,
  );
  return resp.data;
};

export const updatePortfolioSkill = async (
  id: number,
  data: UpdatePortfolioSkillReq,
) => {
  const resp = await axiosInstance.put<ResponseWrapper<PortfolioSkillResp>>(
    endpoints.portfolio_skill.detail(id),
    data,
  );
  return resp.data;
};

export const deletePortfolioSkill = async (id: number) => {
  const resp = await axiosInstance.delete<ResponseWrapper<PortfolioSkillResp>>(
    endpoints.portfolio_skill.detail(id),
  );
  return resp.data;
};

export const getPortfolioSkillMappingById = async (id: number) => {
  const resp = await axiosInstance.get<ResponseWrapper<any>>(
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
