import { axiosInstance } from "../lib/axios";
import { endpoints } from "../configs/endpoints.config";
import type { ResponseWrapper } from "../types/global-type";
import type {
  CreatePortfolioCertificateReq,
  PortfolioCertificateResp,
  UpdatePortfolioCertificateReq,
} from "../types/portfolio-certificate-type.type";

export const getAllPortfolioCertificate = async (user_id: string) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<PortfolioCertificateResp[]>
  >(endpoints.portfolio_certificate.root, {
    params: { user_id },
  });

  return resp.data;
};

export const getPortfolioCertificateById = async (id: number) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<PortfolioCertificateResp>
  >(endpoints.portfolio_certificate.detail(id));

  return resp.data;
};

export const createPortfolioCertificate = async (
  data: CreatePortfolioCertificateReq,
  files?: File[],
) => {
  const formData = new FormData();

  // Append form fields
  formData.append("user_id", data.user_id);
  if (data.date) formData.append("date", data.date);
  if (data.organize) formData.append("organize", data.organize);
  if (data.name) formData.append("name", data.name);
  if (data.description) formData.append("description", data.description);
  if (data.is_show !== undefined)
    formData.append("is_show", data.is_show.toString());

  // Append files
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append("files", file);
    });
  }

  const resp = await axiosInstance.post<
    ResponseWrapper<PortfolioCertificateResp>
  >(endpoints.portfolio_certificate.root, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return resp.data;
};

export const updatePortfolioCertificate = async (
  id: number,
  data: UpdatePortfolioCertificateReq,
  files?: File[],
) => {
  const formData = new FormData();

  if (data.date !== undefined) formData.append("date", data.date);
  if (data.organize !== undefined) formData.append("organize", data.organize);
  if (data.name !== undefined) formData.append("name", data.name);
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

  const resp = await axiosInstance.put<
    ResponseWrapper<PortfolioCertificateResp>
  >(endpoints.portfolio_certificate.detail(id), formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return resp.data;
};

export const deletePortfolioCertificate = async (id: number) => {
  const resp = await axiosInstance.delete<
    ResponseWrapper<PortfolioCertificateResp>
  >(endpoints.portfolio_certificate.detail(id));

  return resp.data;
};
