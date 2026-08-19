import { endpoints } from "../configs/endpoints.config";
import { axiosInstance } from "../lib/axios";
import type { ResponseWrapper } from "../types/global-type";
import type { StudentActivityDetailResp } from "@deep-portfolio/api-types";

export const getStudentActivityDetail = async (student_activity_id: number) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<StudentActivityDetailResp>
  >(endpoints.activity.student, {
    params: { student_activity_id },
  });

  return resp.data;
};
