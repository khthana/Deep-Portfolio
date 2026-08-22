import type { UserDetail } from "@deep-portfolio/api-types";
import { endpoints } from "../configs/endpoints.config";
import { axiosInstance } from "../lib/axios";
import type { ResponseWrapper } from "../types/global-type";

/**
 * One `users` row — the caller's own, which is the only one the API answers.
 *
 * `auth.service.ts` used to hold a second copy of this function, character for
 * character and pointing at the same endpoint, imported by nobody. It is gone
 * (#68).
 */
export const getUser = async (id: string) => {
  const resp = await axiosInstance.get<ResponseWrapper<UserDetail>>(
    endpoints.user.detail(id),
  );

  return resp.data;
};
