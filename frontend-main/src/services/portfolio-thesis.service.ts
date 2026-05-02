import { axiosInstance } from "../lib/axios";
import { endpoints } from "../configs/endpoints.config";
import type { ResponseWrapper } from "../types/global-type";
import type {
  CreatePortfolioThesisReq,
  PortfolioThesisResp,
  UpdatePortfolioThesisReq,
} from "../features/student/portfolio/types/portfolio-thesis-type.type";

export const getAllPortfolioThesis = async (user_id: string) => {
  const resp = await axiosInstance.get<ResponseWrapper<PortfolioThesisResp[]>>(
    endpoints.portfolio_thesis.root,
    {
      params: { user_id },
    },
  );

  return resp.data;
};

export const getPortfolioThesisById = async (id: number) => {
  const resp = await axiosInstance.get<ResponseWrapper<PortfolioThesisResp>>(
    endpoints.portfolio_thesis.detail(id),
  );

  return resp.data;
};

export const createPortfolioThesis = async (
  data: CreatePortfolioThesisReq,
  files?: File[],
) => {
  const formData = new FormData();

  formData.append("user_id", data.user_id);
  formData.append("name", data.name);
  if (data.repository) formData.append("repository", data.repository);
  if (data.role_and_resp) formData.append("role_and_resp", data.role_and_resp);
  if (data.init_expect) formData.append("init_expect", data.init_expect);
  if (data.reflection) formData.append("reflection", data.reflection);

  if (data.is_show_repo !== undefined)
    formData.append("is_show_repo", String(data.is_show_repo));
  if (data.is_show_role !== undefined)
    formData.append("is_show_role", String(data.is_show_role));
  if (data.is_show_init !== undefined)
    formData.append("is_show_init", String(data.is_show_init));
  if (data.is_show_reflec !== undefined)
    formData.append("is_show_reflec", String(data.is_show_reflec));

  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append("files", file);
    });
  }

  const resp = await axiosInstance.post<ResponseWrapper<PortfolioThesisResp>>(
    endpoints.portfolio_thesis.root,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return resp.data;
};

export const updatePortfolioThesis = async (
  id: number,
  data: UpdatePortfolioThesisReq,
  files?: File[],
) => {
  const formData = new FormData();

  if (data.name) formData.append("name", data.name);
  if (data.repository) formData.append("repository", data.repository);
  if (data.role_and_resp) formData.append("role_and_resp", data.role_and_resp);
  if (data.init_expect) formData.append("init_expect", data.init_expect);
  if (data.reflection) formData.append("reflection", data.reflection);

  if (data.is_show_repo !== undefined)
    formData.append("is_show_repo", String(data.is_show_repo));
  if (data.is_show_role !== undefined)
    formData.append("is_show_role", String(data.is_show_role));
  if (data.is_show_init !== undefined)
    formData.append("is_show_init", String(data.is_show_init));
  if (data.is_show_reflec !== undefined)
    formData.append("is_show_reflec", String(data.is_show_reflec));

  if (data.ids_to_delete && data.ids_to_delete.length > 0) {
    data.ids_to_delete.forEach((delId) => {
      formData.append("ids_to_delete", String(delId));
    });
  }

  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append("files", file);
    });
  }

  const resp = await axiosInstance.put<ResponseWrapper<PortfolioThesisResp>>(
    endpoints.portfolio_thesis.detail(id),
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return resp.data;
};

export const deletePortfolioThesis = async (id: number) => {
  const resp = await axiosInstance.delete<ResponseWrapper<null>>(
    endpoints.portfolio_thesis.detail(id),
  );
  return resp.data;
};
