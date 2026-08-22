import { endpoints } from "../../../../configs/endpoints.config";
import { axiosInstance } from "../../../../lib/axios";
import type { ResponseWrapper } from "../../../../types/global-type";
import type {
  ActivityCLOMapping,
  CLOMappedActivity,
  CLOMappedLearningActivity,
  LearningActivityCLOMapping,
} from "@deep-portfolio/api-types";
import type {
  CreateActivityCLOMappingBodyReq,
  CreateLearningActivityCLOMappingBodyReq,
} from "../types/mapping-type.type";

export const createActivityCLOMapping = async (
  body: CreateActivityCLOMappingBodyReq,
) => {
  const resp = await axiosInstance.post<ResponseWrapper<ActivityCLOMapping>>(
    endpoints.mapping.activity.root,
    body,
  );

  return resp.data;
};

export const getActivity = async (clo_id: number) => {
  const resp = await axiosInstance.get<ResponseWrapper<CLOMappedActivity[]>>(
    endpoints.mapping.activity.root,
    { params: { clo_id } },
  );

  return resp.data;
};

//-------------------------------------------------------------------

export const createLearningActivityCLOMapping = async (
  body: CreateLearningActivityCLOMappingBodyReq,
) => {
  const resp = await axiosInstance.post<
    ResponseWrapper<LearningActivityCLOMapping>
  >(endpoints.mapping.learning_activity, body);

  return resp.data;
};

export const getLearningActivity = async (clo_id: number) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<CLOMappedLearningActivity[]>
  >(endpoints.mapping.learning_activity, { params: { clo_id } });

  return resp.data;
};
