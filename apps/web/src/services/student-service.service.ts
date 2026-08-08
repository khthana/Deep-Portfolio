import { endpoints } from "../configs/endpoints.config";
import { axiosInstance } from "../lib/axios";
import type { ResponseWrapper } from "../types/global-type";
import type { StudentDetailResp } from "../types/student-type.type";

export const getAllStudentInSection = async (section_id: number) => {
  const resp = await axiosInstance.get<ResponseWrapper<StudentDetailResp[]>>(
    endpoints.student.list,
    { params: { section_id } },
  );

  return resp.data;
};
