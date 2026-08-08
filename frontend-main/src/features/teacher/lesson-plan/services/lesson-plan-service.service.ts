import { endpoints } from "../../../../configs/endpoints.config";
import { axiosInstance } from "../../../../lib/axios";
import type { LessonPlanResp } from "../../../../types/course-type.type";
import type { Options, ResponseWrapper } from "../../../../types/global-type";
import type {
  AddLessonPlanBody,
  UpdateLessonPlanBody,
} from "../types/lesson-plan-type.type";

export const addLessonPlan = async (req: AddLessonPlanBody) => {
  const resp = await axiosInstance.post<
    ResponseWrapper<{ lesson_plan_id: number }>
  >(endpoints.lesson_plan.root, req);

  return resp.data;
};

export const updateLessonPlan = async (body: UpdateLessonPlanBody) => {
  const resp = await axiosInstance.put<ResponseWrapper<LessonPlanResp>>(
    endpoints.lesson_plan.root,
    body
  );

  return resp.data;
};

export const deleteLessonPlan = async (lesson_plan_id: number) => {
  const resp = await axiosInstance.delete<
    ResponseWrapper<{ lesson_plan_id: number }>
  >(endpoints.lesson_plan.root, { params: { lesson_plan_id } });

  return resp.data;
};

export const getLessonPlanOptions = async (section_id: number) => {
  const resp = await axiosInstance.get<ResponseWrapper<Options[]>>(
    endpoints.lesson_plan.options,
    { params: { section_id } }
  );

  return resp.data;
};
