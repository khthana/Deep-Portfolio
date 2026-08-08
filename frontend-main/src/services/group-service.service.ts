import { endpoints } from "../configs/endpoints.config";
import { axiosInstance } from "../lib/axios";
import type { ResponseWrapper } from "../types/global-type";
import type {
  AcceptInviteBody,
  ValidateInvite,
} from "../types/group-type.type";
import type { UserResp } from "../types/user-type.type";

export const acceptInvite = async (body: AcceptInviteBody) => {
  const resp = await axiosInstance.post<ResponseWrapper<any>>(
    endpoints.group.acceptInvite,
    body,
  );

  return resp.data;
};

export const validateInvite = async (body: ValidateInvite) => {
  const resp = await axiosInstance.post<
    ResponseWrapper<{ status: "ACCEPTED" | "REJECTED" | "PENDING" }>
  >(endpoints.group.validateInvite, body);

  return resp.data;
};
