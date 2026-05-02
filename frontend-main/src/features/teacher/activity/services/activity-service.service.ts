import { endpoints } from "../../../../configs/endpoints.config";
import { axiosInstance } from "../../../../lib/axios";
import type { GetActivityDetailResp } from "../../../../types/activity-type.type";
import type { Options, ResponseWrapper } from "../../../../types/global-type";
import type {
  AddStudentActivityToBookmark,
  GetAllActivityList,
  GetAllSubmittedActivityByActivityIdResp,
  GradeStudentActivityData,
  GradeStudentActivityResp,
} from "../types/activity-type.type";

export const createActivity = async (formData: FormData) => {
  const resp = await axiosInstance.post<ResponseWrapper<{ id: number }>>(
    endpoints.activity.root,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return resp.data;
};

export const getActivity = async (activity_id: number) => {
  const resp = await axiosInstance.get<ResponseWrapper<GetActivityDetailResp>>(
    endpoints.activity.root,
    { params: { activity_id } },
  );

  return resp.data;
};

export const removeActivity = async (activity_id: number) => {
  const resp = await axiosInstance.delete<ResponseWrapper<{ id: number }>>(
    endpoints.activity.root,
    { params: { activity_id } },
  );

  return resp.data;
};

export const updateActivity = async (formData: FormData) => {
  const resp = await axiosInstance.put<ResponseWrapper<{ id: number }>>(
    endpoints.activity.root,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return resp.data;
};

export const getActivityOptions = async (section_id: number) => {
  const resp = await axiosInstance.get<ResponseWrapper<Options[]>>(
    endpoints.activity.options,
    {
      params: { section_id },
    },
  );

  return resp.data;
};

export const getAllActivityList = async (section_id: number) => {
  const resp = await axiosInstance.get<ResponseWrapper<GetAllActivityList[]>>(
    endpoints.activity.list,
    {
      params: { section_id },
    },
  );

  return resp.data;
};

export const getAllSubmittedActivityList = async (activity_id: number) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<GetAllSubmittedActivityByActivityIdResp>
  >(endpoints.activity.submitted_list, {
    params: { activity_id },
  });

  return resp.data;
};

export const gradeStudentActivity = async (body: GradeStudentActivityData) => {
  const resp = await axiosInstance.post<
    ResponseWrapper<GradeStudentActivityResp>
  >(endpoints.student_activity.grade, body);

  return resp.data;
};

export const bookmarkStudentActivity = async (
  body: AddStudentActivityToBookmark,
) => {
  const resp = await axiosInstance.patch<
    ResponseWrapper<{ is_bookmark: boolean }>
  >(endpoints.student_activity.bookmark, body);

  return resp.data;
};

export const validateActivityCLOMapping = async (activity_id: number) => {
  const resp = await axiosInstance.get<ResponseWrapper<boolean>>(
    endpoints.mapping.activity.validate,
    { params: { activity_id } },
  );

  return resp.data;
};
