import { endpoints } from "../configs/endpoints.config";
import { axiosInstance } from "../lib/axios";
import type { ResponseWrapper } from "../types/global-type";
import type {
  PortfolioPersonalDetail,
  PortfolioPersonalRow,
} from "@deep-portfolio/api-types";
import type { UpsertPortfolioPersonalReq } from "../types/portfolio-personal-type.type";

export const getPortfolioPersonal = async (user_id: string) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<PortfolioPersonalDetail>
  >(endpoints.portfolio_personal.detail(user_id));

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

  // The row, not the detail: an upsert hands back what it wrote, with no
  // `attachments` key beside it. The read is the only endpoint that goes and
  // fetches the picture (#68).
  const resp = await axiosInstance.post<ResponseWrapper<PortfolioPersonalRow>>(
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
