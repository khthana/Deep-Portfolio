import { axiosInstance } from "../lib/axios";
import { endpoints } from "../configs/endpoints.config";
import type { ResponseWrapper } from "../types/global-type";
import type {
  PortfolioInternshipResp,
  CreatePortfolioInternshipReq,
  UpdatePortfolioInternshipReq,
} from "../types/portfolio-internship-type.type";

export const getAllPortfolioInternship = async (userId: string) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<PortfolioInternshipResp[]>
  >(endpoints.portfolio_internship.root, {
    params: { user_id: userId },
  });

  return resp.data;
};

export const getPortfolioInternshipById = async (id: number) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<PortfolioInternshipResp>
  >(endpoints.portfolio_internship.detail(id));

  return resp.data;
};

export const createPortfolioInternship = async (
  data: CreatePortfolioInternshipReq,
  files?: File[],
) => {
  const formData = new FormData();

  // Append form fields
  formData.append("user_id", data.user_id);
  formData.append("type", data.type);
  if (data.title) formData.append("title", data.title);
  if (data.position) formData.append("position", data.position);
  if (data.company) formData.append("company", data.company);
  if (data.country) formData.append("country", data.country);
  if (data.province) formData.append("province", data.province);
  if (data.start_date) formData.append("start_date", data.start_date);
  if (data.end_date) formData.append("end_date", data.end_date);
  if (data.resp) formData.append("resp", data.resp);
  if (data.is_show_resp !== undefined)
    formData.append("is_show_resp", data.is_show_resp.toString());
  if (data.learning_out) formData.append("learning_out", data.learning_out);
  if (data.is_show_learning !== undefined)
    formData.append("is_show_learning", data.is_show_learning.toString());
  if (data.reflection) formData.append("reflection", data.reflection);
  if (data.is_show_reflec !== undefined)
    formData.append("is_show_reflec", data.is_show_reflec.toString());

  // Append files
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append("files", file);
    });
  }

  const resp = await axiosInstance.post<
    ResponseWrapper<PortfolioInternshipResp>
  >(endpoints.portfolio_internship.root, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return resp.data;
};

export const updatePortfolioInternship = async (
  id: number,
  data: UpdatePortfolioInternshipReq,
  files?: File[],
) => {
  const formData = new FormData();

  if (data.type) formData.append("type", data.type);
  if (data.title) formData.append("title", data.title);
  if (data.position) formData.append("position", data.position);
  if (data.company) formData.append("company", data.company);
  if (data.country) formData.append("country", data.country);
  if (data.province) formData.append("province", data.province);
  if (data.start_date) formData.append("start_date", data.start_date);
  if (data.end_date) formData.append("end_date", data.end_date);
  if (data.resp) formData.append("resp", data.resp);
  if (data.is_show_resp !== undefined)
    formData.append("is_show_resp", data.is_show_resp.toString());
  if (data.learning_out) formData.append("learning_out", data.learning_out);
  if (data.is_show_learning !== undefined)
    formData.append("is_show_learning", data.is_show_learning.toString());
  if (data.reflection) formData.append("reflection", data.reflection);
  if (data.is_show_reflec !== undefined)
    formData.append("is_show_reflec", data.is_show_reflec.toString());

  if (data.ids_to_delete && data.ids_to_delete.length > 0) {
    data.ids_to_delete.forEach((delId) => {
      formData.append("ids_to_delete[]", delId.toString());
    });
  }

  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append("files", file);
    });
  }

  const resp = await axiosInstance.put<
    ResponseWrapper<PortfolioInternshipResp>
  >(endpoints.portfolio_internship.detail(id), formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return resp.data;
};

export const deletePortfolioInternship = async (id: number) => {
  const resp = await axiosInstance.delete<
    ResponseWrapper<PortfolioInternshipResp>
  >(endpoints.portfolio_internship.detail(id));

  return resp.data;
};
