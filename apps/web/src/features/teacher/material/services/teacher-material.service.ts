import { endpoints } from "../../../../configs/endpoints.config";
import { axiosInstance } from "../../../../lib/axios";
import type { ResponseWrapper } from "../../../../types/global-type";
import type { CourseMaterialWeek } from "@deep-portfolio/api-types";

export const createCourseMaterial = async (formData: FormData) => {
  const resp = await axiosInstance.post<ResponseWrapper<any>>(
    endpoints.course_material.root,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return resp.data;
};

export const getCourseMaterial = async (section_id: number) => {
  const resp = await axiosInstance.get<ResponseWrapper<CourseMaterialWeek[]>>(
    endpoints.course_material.root,
    { params: { section_id } },
  );

  return resp.data;
};

// todo : change attachment_id to something that refer to specific section
export const deleteCourseMaterial = async (attachment_id: number) => {
  const resp = await axiosInstance.delete<ResponseWrapper<any>>(
    endpoints.course_material.root,
    { params: { attachment_id } },
  );

  return resp.data;
};
