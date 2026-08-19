import { endpoints } from "../configs/endpoints.config";
import { axiosInstance } from "../lib/axios";
import type { ResponseWrapper } from "../types/global-type";
import type { StudentLearningActivityDetailResp } from "@deep-portfolio/api-types";

export const getStudentLearningActivityDetail = async (
  student_learning_activity_id: number,
) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<StudentLearningActivityDetailResp>
  >(endpoints.learning_activity.student, {
    params: { student_learning_activity_id },
  });

  return resp.data;
};
