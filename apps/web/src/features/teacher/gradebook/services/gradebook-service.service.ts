import { endpoints } from "../../../../configs/endpoints.config";
import { axiosInstance } from "../../../../lib/axios";
import type {
  GradebookPerActivityResp,
  GradebookPerStudentResp,
} from "@deep-portfolio/api-types";
import type { ResponseWrapper } from "../../../../types/global-type";

export const getGradebookPerStudent = async (params: {
  section_id: number;
}) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<GradebookPerStudentResp>
  >(endpoints.gradebook.per_student, { params: params });

  return resp.data;
};

export const getGradebookPerActivity = async (params: {
  section_id: number;
}) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<GradebookPerActivityResp>
  >(endpoints.gradebook.per_activity, { params: params });

  return resp.data;
};
