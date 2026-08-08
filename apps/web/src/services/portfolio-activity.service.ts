import { axiosInstance } from "../lib/axios";
import { endpoints } from "../configs/endpoints.config";
import type { ResponseWrapper } from "../types/global-type";
import type {
  CreatePortfolioActivityReq,
  PortfolioActivityResp,
  UpdatePortfolioActivityReq,
} from "../types/portfolio-activity-type.type";

export const getAllPortfolioActivity = async (user_id: string) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<PortfolioActivityResp[]>
  >(endpoints.portfolio_activity.root, {
    params: { user_id },
  });

  return resp.data;
};

export const getPortfolioActivityById = async (id: number) => {
  const resp = await axiosInstance.get<ResponseWrapper<PortfolioActivityResp>>(
    endpoints.portfolio_activity.detail(id),
  );

  return resp.data;
};

export const createPortfolioActivity = async (
  data: CreatePortfolioActivityReq,
  files?: File[],
) => {
  const formData = new FormData();

  formData.append("user_id", data.user_id);
  if (data.name) formData.append("name", data.name);
  if (data.date) formData.append("date", data.date);
  if (data.role) formData.append("role", data.role);
  if (data.description) formData.append("description", data.description);
  if (data.is_show !== undefined)
    formData.append("is_show", data.is_show.toString());

  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append("files", file);
    });
  }

  const resp = await axiosInstance.post<ResponseWrapper<PortfolioActivityResp>>(
    endpoints.portfolio_activity.root,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return resp.data;
};

export const updatePortfolioActivity = async (
  id: number,
  data: UpdatePortfolioActivityReq,
  files?: File[],
) => {
  const formData = new FormData();

  if (data.name !== undefined) formData.append("name", data.name);
  if (data.date !== undefined) formData.append("date", data.date);
  if (data.role !== undefined) formData.append("role", data.role);
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

  const resp = await axiosInstance.put<ResponseWrapper<PortfolioActivityResp>>(
    endpoints.portfolio_activity.detail(id),
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return resp.data;
};

export const deletePortfolioActivity = async (id: number) => {
  const resp = await axiosInstance.delete<
    ResponseWrapper<PortfolioActivityResp>
  >(endpoints.portfolio_activity.detail(id));

  return resp.data;
};
