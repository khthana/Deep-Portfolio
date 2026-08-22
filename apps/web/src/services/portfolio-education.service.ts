import { axiosInstance } from "../lib/axios";
import { endpoints } from "../configs/endpoints.config";
import type { ResponseWrapper } from "../types/global-type";
import type { PortfolioEducationDetail } from "@deep-portfolio/api-types";
import type {
  CreatePortfolioEducationReq,
  UpdatePortfolioEducationReq,
} from "../types/portfolio-education-type.type";

export const getAllPortfolioEducation = async (user_id: string) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<PortfolioEducationDetail[]>
  >(endpoints.portfolio_education.list, {
    params: { user_id },
  });

  return resp.data;
};

export const createPortfolioEducation = async (
  data: CreatePortfolioEducationReq,
) => {
  const resp = await axiosInstance.post<
    ResponseWrapper<PortfolioEducationDetail>
  >(endpoints.portfolio_education.root, data);
  return resp.data;
};

export const updatePortfolioEducation = async (
  id: number,
  data: UpdatePortfolioEducationReq,
) => {
  const resp = await axiosInstance.put<
    ResponseWrapper<PortfolioEducationDetail>
  >(endpoints.portfolio_education.detail(id), data);
  return resp.data;
};

export const deletePortfolioEducation = async (id: number) => {
  // `data: null`, not the row: the service reads the row it removed and the
  // controller does not pass it on (#68).
  const resp = await axiosInstance.delete<ResponseWrapper<null>>(
    endpoints.portfolio_education.detail(id),
  );
  return resp.data;
};
