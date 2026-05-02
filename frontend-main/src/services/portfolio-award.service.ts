import { axiosInstance } from "../lib/axios";
import { endpoints } from "../configs/endpoints.config";
import type { ResponseWrapper } from "../types/global-type";
import type {
  CreatePortfolioAwardReq,
  PortfolioAwardResp,
  UpdatePortfolioAwardReq,
} from "../types/portfolio-award-type.type";

export const getAllPortfolioAward = async (user_id: string) => {
  const resp = await axiosInstance.get<ResponseWrapper<PortfolioAwardResp[]>>(
    endpoints.portfolio_award.root,
    {
      params: { user_id },
    },
  );

  return resp.data;
};

export const getPortfolioAwardById = async (id: number) => {
  const resp = await axiosInstance.get<ResponseWrapper<PortfolioAwardResp>>(
    endpoints.portfolio_award.detail(id),
  );

  return resp.data;
};

export const createPortfolioAward = async (
  data: CreatePortfolioAwardReq,
  files?: File[],
) => {
  const formData = new FormData();

  // Append form fields
  formData.append("user_id", data.user_id);
  if (data.award) formData.append("award", data.award);
  if (data.name) formData.append("name", data.name);
  if (data.organize) formData.append("organize", data.organize);
  if (data.date) formData.append("date", data.date);
  if (data.description) formData.append("description", data.description);
  if (data.is_show !== undefined)
    formData.append("is_show", data.is_show.toString());

  // Append files
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append("files", file);
    });
  }

  const resp = await axiosInstance.post<ResponseWrapper<PortfolioAwardResp>>(
    endpoints.portfolio_award.root,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return resp.data;
};

export const updatePortfolioAward = async (
  id: number,
  data: UpdatePortfolioAwardReq,
  files?: File[],
) => {
  const formData = new FormData();

  if (data.award !== undefined) formData.append("award", data.award);
  if (data.name !== undefined) formData.append("name", data.name);
  if (data.organize !== undefined) formData.append("organize", data.organize);
  if (data.date !== undefined) formData.append("date", data.date);
  if (data.description !== undefined)
    formData.append("description", data.description);
  if (data.is_show !== undefined)
    formData.append("is_show", data.is_show.toString());

  if (data.ids_to_delete && data.ids_to_delete.length > 0) {
    data.ids_to_delete.forEach((id) => {
      formData.append("ids_to_delete[]", id.toString());
    });
  }

  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append("files", file);
    });
  }

  const resp = await axiosInstance.put<ResponseWrapper<PortfolioAwardResp>>(
    endpoints.portfolio_award.detail(id),
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return resp.data;
};

export const deletePortfolioAward = async (id: number) => {
  const resp = await axiosInstance.delete<ResponseWrapper<PortfolioAwardResp>>(
    endpoints.portfolio_award.detail(id),
  );

  return resp.data;
};
