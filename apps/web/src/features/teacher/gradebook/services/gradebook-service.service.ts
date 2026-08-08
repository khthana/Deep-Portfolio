import { endpoints } from "../../../../configs/endpoints.config";
import { axiosInstance } from "../../../../lib/axios";
import type { ResponseWrapper } from "../../../../types/global-type";
import type {
  GradebookPerStudentResp,
  GradebookPerActivityResp,
} from "../types/gradebook-type.type";

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
