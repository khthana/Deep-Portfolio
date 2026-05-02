import { axiosInstance } from "../lib/axios";
import { endpoints } from "../configs/endpoints.config";
import type { ResponseWrapper } from "../types/global-type";
import type {
  CreatePortfolioTrainingReq,
  PortfolioTrainingResp,
  UpdatePortfolioTrainingReq,
} from "../types/portfolio-training-type.type";

export const getAllPortfolioTraining = async (user_id: string) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<PortfolioTrainingResp[]>
  >(endpoints.portfolio_training.root, {
    params: { user_id },
  });

  return resp.data;
};

export const getPortfolioTrainingById = async (id: number) => {
  const resp = await axiosInstance.get<ResponseWrapper<PortfolioTrainingResp>>(
    endpoints.portfolio_training.detail(id),
  );

  return resp.data;
};

export const createPortfolioTraining = async (
  data: CreatePortfolioTrainingReq,
  files?: File[],
) => {
  const formData = new FormData();

  // Append form fields
  formData.append("user_id", data.user_id);
  if (data.year !== undefined) formData.append("year", data.year.toString());
  if (data.country) formData.append("country", data.country);
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

  const resp = await axiosInstance.post<ResponseWrapper<PortfolioTrainingResp>>(
    endpoints.portfolio_training.root,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return resp.data;
};

export const updatePortfolioTraining = async (
  id: number,
  data: UpdatePortfolioTrainingReq,
  files?: File[],
) => {
  const formData = new FormData();

  if (data.year !== undefined) formData.append("year", data.year.toString());
  if (data.country !== undefined) formData.append("country", data.country);
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

  const resp = await axiosInstance.put<ResponseWrapper<PortfolioTrainingResp>>(
    endpoints.portfolio_training.detail(id),
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return resp.data;
};

export const deletePortfolioTraining = async (id: number) => {
  const resp = await axiosInstance.delete<
    ResponseWrapper<PortfolioTrainingResp>
  >(endpoints.portfolio_training.detail(id));

  return resp.data;
};
