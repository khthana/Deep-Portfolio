import { endpoints } from "../../../../configs/endpoints.config";
import { axiosInstance } from "../../../../lib/axios";
import type { ResponseWrapper } from "../../../../types/global-type";
import type {
  ActivityMappingDetailResp,
  CreateActivityCLOMappingBodyReq,
  CreateLearningActivityCLOMappingBodyReq,
  LearningActivityDetail,
} from "../types/mapping-type.type";

export const createActivityCLOMapping = async (
  body: CreateActivityCLOMappingBodyReq,
) => {
  const resp = await axiosInstance.post<ResponseWrapper<{ id: number }>>(
    endpoints.mapping.activity.root,
    body,
  );

  return resp.data;
};

export const getActivity = async (clo_id: number) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<ActivityMappingDetailResp[]>
  >(endpoints.mapping.activity.root, { params: { clo_id } });

  return resp.data;
};

//-------------------------------------------------------------------

export const createLearningActivityCLOMapping = async (
  body: CreateLearningActivityCLOMappingBodyReq,
) => {
  const resp = await axiosInstance.post<ResponseWrapper<{ id: number }>>(
    endpoints.mapping.learning_activity,
    body,
  );

  return resp.data;
};

export const getLearningActivity = async (clo_id: number) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<LearningActivityDetail[]>
  >(endpoints.mapping.learning_activity, { params: { clo_id } });

  return resp.data;
};
