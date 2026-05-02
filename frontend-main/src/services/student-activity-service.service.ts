import { endpoints } from "../configs/endpoints.config";
import { axiosInstance } from "../lib/axios";
import type { ResponseWrapper } from "../types/global-type";
import type { GetStudentActivityDetailResp } from "../types/student-activity-type.type";

export const getStudentActivityDetail = async (student_activity_id: number) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<GetStudentActivityDetailResp>
  >(endpoints.activity.student, {
    params: { student_activity_id },
  });

  return resp.data;
};
