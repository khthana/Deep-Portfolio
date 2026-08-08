import { endpoints } from "../configs/endpoints.config";
import { axiosInstance } from "../lib/axios";
import type { ResponseWrapper } from "../types/global-type";
import type {
  PortfolioPersonalResp,
  UpsertPortfolioPersonalReq,
} from "../types/portfolio-personal-type.type";

export const getPortfolioPersonal = async (user_id: string) => {
  const resp = await axiosInstance.get<ResponseWrapper<PortfolioPersonalResp>>(
    endpoints.portfolio_personal.detail(user_id),
  );

  return resp.data;
};

export const upsertPortfolioPersonal = async (
  user_id: string,
  data: UpsertPortfolioPersonalReq,
  file?: File,
) => {
  const formData = new FormData();
  // Append all data fields to formData
  Object.keys(data).forEach((k) => {
    const key = k as keyof UpsertPortfolioPersonalReq;
    const value = data[key];
    if (value !== undefined) {
      if (value === null) {
        formData.append(key, "null");
      } else if (value instanceof Date) {
        formData.append(key, value.toISOString());
      } else {
        formData.append(key, String(value));
      }
    }
  });

  if (file) {
    formData.append("file", file);
  }

  const resp = await axiosInstance.post<ResponseWrapper<PortfolioPersonalResp>>(
    `${endpoints.portfolio_personal.detail(user_id)}/upsert`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return resp.data;
};
