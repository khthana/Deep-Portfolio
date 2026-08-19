import { endpoints } from "../configs/endpoints.config";
import { axiosInstance } from "../lib/axios";
import type {
  CLOResp,
  CourseDetail,
  LessonPlanWeek,
  PLOResp,
  ScoreWeightDetail,
} from "@deep-portfolio/api-types";
import type { ResponseWrapper } from "../types/global-type";

export const getCourseById = async (section_id: number) => {
  const resp = await axiosInstance.get<ResponseWrapper<CourseDetail>>(
    endpoints.course.root,
    {
      params: { section_id },
    },
  );

  return resp.data;
};

export const getScoreWeight = async (section_id: number) => {
  const resp = await axiosInstance.get<ResponseWrapper<ScoreWeightDetail[]>>(
    endpoints["score_weight"].root,
    { params: { section_id } },
  );

  return resp.data;
};

export const getCLO = async (section_id: number) => {
  const resp = await axiosInstance.get<ResponseWrapper<CLOResp[]>>(
    endpoints.course.clo,
    { params: { section_id } },
  );

  return resp.data;
};

export const getPLOList = async (program_id: string) => {
  const resp = await axiosInstance.get<ResponseWrapper<PLOResp[]>>(
    endpoints.course.plo,
    { params: { program_id } },
  );

  return resp.data;
};

export const getLessonPlan = async (section_id: number) => {
  const resp = await axiosInstance.get<ResponseWrapper<LessonPlanWeek[]>>(
    endpoints.lesson_plan.root,
    { params: { section_id } },
  );

  return resp.data;
};
