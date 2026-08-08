import { endpoints } from "../../../../configs/endpoints.config";
import { axiosInstance } from "../../../../lib/axios";
import type { GetLearningActivityDetailResp } from "../../../../types/activity-type.type";
import type { Options, ResponseWrapper } from "../../../../types/global-type";
import type {
  AddStudentLearningActivityToBookmark,
  GetAllLearningActivityList,
  GetAllSubmittedLearningActivityByLearningActivityIdResp,
  GradeStudentLearningActivityData,
} from "../types/learning-activity-type.type";

export const getLearningActivity = async (learning_activity_id: number) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<GetLearningActivityDetailResp>
  >(endpoints.learning_activity.root, {
    params: { learning_activity_id },
  });

  return resp.data;
};

export const removeLearningActivity = async (learning_activity_id: number) => {
  const resp = await axiosInstance.delete<ResponseWrapper<any>>(
    endpoints.learning_activity.root,
    {
      params: { learning_activity_id },
    },
  );

  return resp.data;
};

export const createLearningActivity = async (formData: FormData) => {
  const resp = await axiosInstance.post<ResponseWrapper<{ id: number }>>(
    endpoints.learning_activity.root,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return resp.data;
};

export const updateLearningActivity = async (formData: FormData) => {
  const resp = await axiosInstance.put<ResponseWrapper<{ id: number }>>(
    endpoints.learning_activity.root,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return resp.data;
};

export const getLearningActivityOptions = async (section_id: number) => {
  const resp = await axiosInstance.get<ResponseWrapper<Options[]>>(
    endpoints.learning_activity.options,
    {
      params: { section_id },
    },
  );

  return resp.data;
};

//---------------------------------------------

export const getAllLearningActivityList = async (section_id: number) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<GetAllLearningActivityList[]>
  >(endpoints.learning_activity.list, {
    params: { section_id },
  });

  return resp.data;
};

export const getAllSubmittedLearningActivityList = async (
  learning_activity_id: number,
) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<GetAllSubmittedLearningActivityByLearningActivityIdResp>
  >(endpoints.learning_activity.submitted_list, {
    params: { learning_activity_id },
  });

  return resp.data;
};

export const gradeStudentLearningActivity = async (
  body: GradeStudentLearningActivityData,
) => {
  const resp = await axiosInstance.post<ResponseWrapper<any>>(
    endpoints.student_learning_activity.grade,
    body,
  );

  return resp.data;
};

export const bookmarkStudentLearningActivity = async (
  body: AddStudentLearningActivityToBookmark,
) => {
  const resp = await axiosInstance.patch<
    ResponseWrapper<{ is_bookmark: boolean }>
  >(endpoints.student_learning_activity.bookmark, body);

  return resp.data;
};
