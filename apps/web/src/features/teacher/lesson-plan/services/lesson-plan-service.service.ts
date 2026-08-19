import { endpoints } from "../../../../configs/endpoints.config";
import { axiosInstance } from "../../../../lib/axios";
import type {
  LessonPlanIdResp,
  LessonPlanRow,
} from "@deep-portfolio/api-types";
import type { Options, ResponseWrapper } from "../../../../types/global-type";
import type {
  AddLessonPlanBody,
  UpdateLessonPlanBody,
} from "../types/lesson-plan-type.type";

export const addLessonPlan = async (req: AddLessonPlanBody) => {
  const resp = await axiosInstance.post<ResponseWrapper<LessonPlanIdResp>>(
    endpoints.lesson_plan.root,
    req,
  );

  return resp.data;
};

export const updateLessonPlan = async (body: UpdateLessonPlanBody) => {
  // The row alone. This said `LessonPlanResp` until #68, the same type the
  // list read uses — but a `PUT` sends no `allActivities`, because that list is
  // something the reads build.
  const resp = await axiosInstance.put<ResponseWrapper<LessonPlanRow>>(
    endpoints.lesson_plan.root,
    body,
  );

  return resp.data;
};

export const deleteLessonPlan = async (lesson_plan_id: number) => {
  const resp = await axiosInstance.delete<ResponseWrapper<LessonPlanIdResp>>(
    endpoints.lesson_plan.root,
    { params: { lesson_plan_id } },
  );

  return resp.data;
};

export const getLessonPlanOptions = async (section_id: number) => {
  const resp = await axiosInstance.get<ResponseWrapper<Options[]>>(
    endpoints.lesson_plan.options,
    { params: { section_id } },
  );

  return resp.data;
};
