import { endpoints } from "../configs/endpoints.config";
import { axiosInstance } from "../lib/axios";
import type { ResponseWrapper } from "../types/global-type";
import type { UserResp } from "../types/user-type.type";

export const getUser = async (id: string) => {
  const resp = await axiosInstance.get<ResponseWrapper<UserResp>>(
    endpoints.user.detail(id),
  );

  return resp.data;
};
