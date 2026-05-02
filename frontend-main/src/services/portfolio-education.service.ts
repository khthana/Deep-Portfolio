import { axiosInstance } from "../lib/axios";
import { endpoints } from "../configs/endpoints.config";
import type { ResponseWrapper } from "../types/global-type";
import type {
  CreatePortfolioEducationReq,
  PortfolioEducationResp,
  UpdatePortfolioEducationReq,
} from "../types/portfolio-education-type.type";

export const getAllPortfolioEducation = async (user_id: string) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<PortfolioEducationResp[]>
  >(endpoints.portfolio_education.list, {
    params: { user_id },
  });

  return resp.data;
};

export const createPortfolioEducation = async (
  data: CreatePortfolioEducationReq,
) => {
  const resp = await axiosInstance.post<
    ResponseWrapper<PortfolioEducationResp>
  >(endpoints.portfolio_education.root, data);
  return resp.data;
};

export const updatePortfolioEducation = async (
  id: number,
  data: UpdatePortfolioEducationReq,
) => {
  const resp = await axiosInstance.put<ResponseWrapper<PortfolioEducationResp>>(
    endpoints.portfolio_education.detail(id),
    data,
  );
  return resp.data;
};

export const deletePortfolioEducation = async (id: number) => {
  const resp = await axiosInstance.delete<
    ResponseWrapper<PortfolioEducationResp>
  >(endpoints.portfolio_education.detail(id));
  return resp.data;
};
