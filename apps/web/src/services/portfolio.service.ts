import { axiosInstance } from "../lib/axios";
import { endpoints } from "../configs/endpoints.config";
import type { ResponseWrapper } from "../types/global-type";
import type { PortfolioConfig } from "../features/student/portfolio/components/e-portfolio-template/types";

export interface PortfolioTemplate {
  id: number;
  name: string;
}

export interface CreatePortfolioReq {
  user_id: string;
  template_id: number;
  portfolio_name: string;
  template_color: string;
  about_me?: string;
  selectedSkillIds?: number[];
  isShowPersonal?: boolean;
  isShowEducation?: boolean;
  isShowTraining?: boolean;
  isShowCertificate?: boolean;
  isShowSkill?: boolean;
  isShowIntern?: boolean;
  isShowThesis?: boolean;
  isShowAward?: boolean;
  isShowActivity?: boolean;
}

// Define types to match backend response then map to frontend PortfolioConfig
export interface PortfolioBackendResp extends Omit<
  PortfolioConfig,
  "id" | "selectedSkillIds"
> {
  id: string;
  selectedSkillIds: number[];
}

const mapBackendToFrontend = (p: PortfolioBackendResp): PortfolioConfig => ({
  ...p,
  id: p.id,
  selectedSkillIds: p.selectedSkillIds?.map((id) => id.toString()) || [],
});

export const getAllPortfolios = async (
  userId: string,
): Promise<ResponseWrapper<PortfolioConfig[]>> => {
  const resp = await axiosInstance.get<ResponseWrapper<PortfolioBackendResp[]>>(
    endpoints.portfolio.root,
    {
      params: { user_id: userId },
    },
  );
  if (resp.data.success) {
    return {
      ...resp.data,
      data: resp.data.data.map(mapBackendToFrontend),
    };
  }
  return resp.data as unknown as ResponseWrapper<PortfolioConfig[]>;
};

export const getPortfolioById = async (
  id: string,
): Promise<ResponseWrapper<PortfolioConfig>> => {
  const resp = await axiosInstance.get<ResponseWrapper<PortfolioBackendResp>>(
    endpoints.portfolio.detail(id as any),
  );
  if (resp.data.success) {
    return {
      ...resp.data,
      data: mapBackendToFrontend(resp.data.data),
    };
  }
  return resp.data as unknown as ResponseWrapper<PortfolioConfig>;
};

export const createPortfolio = async (
  data: CreatePortfolioReq,
): Promise<ResponseWrapper<PortfolioConfig>> => {
  const resp = await axiosInstance.post<ResponseWrapper<PortfolioBackendResp>>(
    endpoints.portfolio.root,
    data,
  );
  if (resp.data.success) {
    return {
      ...resp.data,
      data: mapBackendToFrontend(resp.data.data),
    };
  }
  return resp.data as unknown as ResponseWrapper<PortfolioConfig>;
};

export const updatePortfolio = async (
  id: string,
  data: Partial<CreatePortfolioReq>,
): Promise<ResponseWrapper<PortfolioConfig>> => {
  const resp = await axiosInstance.patch<ResponseWrapper<PortfolioBackendResp>>(
    endpoints.portfolio.detail(id as any),
    data,
  );
  if (resp.data.success) {
    return {
      ...resp.data,
      data: mapBackendToFrontend(resp.data.data),
    };
  }
  return resp.data as unknown as ResponseWrapper<PortfolioConfig>;
};

export const deletePortfolio = async (
  id: string,
): Promise<ResponseWrapper<null>> => {
  const resp = await axiosInstance.delete<ResponseWrapper<null>>(
    endpoints.portfolio.detail(id as any),
  );
  return resp.data;
};

export const generateShareLink = async (
  id: string,
  expiresAt: string | null,
) => {
  const response = await axiosInstance.post(
    `/portfolio/${id}/generate-share-link`,
    {
      expiresAt,
    },
  );
  return response.data;
};

export const getAllTemplates = async (): Promise<
  ResponseWrapper<PortfolioTemplate[]>
> => {
  const resp = await axiosInstance.get<ResponseWrapper<PortfolioTemplate[]>>(
    `${endpoints.portfolio.root}/templates`,
  );
  return resp.data;
};
