import { endpoints } from "../../../../configs/endpoints.config";
import { axiosInstance } from "../../../../lib/axios";
import type { CourseDetail } from "../../../../types/course-type.type";
import type { ResponseWrapper } from "../../../../types/global-type";
import type {
  AllClassworkDetailResp,
  GetStudentAllCLassworkListParams,
  StudentDetail,
} from "../types/home-type";

export const getStudentAllClassworkList = async (
  params: GetStudentAllCLassworkListParams,
) => {
  const resp = await axiosInstance.get<ResponseWrapper<AllClassworkDetailResp>>(
    endpoints.student.all_classwork,
    { params: params },
  );

  return resp.data;
};

export const getStudentDetail = async (student_id: string) => {
  const resp = await axiosInstance.get<ResponseWrapper<StudentDetail>>(
    endpoints.user.student,
    { params: { student_id } },
  );

  return resp.data;
};
