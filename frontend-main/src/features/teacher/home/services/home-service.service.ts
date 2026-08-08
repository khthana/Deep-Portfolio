import { endpoints } from "../../../../configs/endpoints.config";
import { axiosInstance } from "../../../../lib/axios";
import type { ResponseWrapper } from "../../../../types/global-type";
import type {
  CourseDetailBrief,
  GetAllCoursesParams,
  TeacherCourseListResp,
} from "../types/home-type";

export const getAllCourses = async (params: GetAllCoursesParams) => {
  const resp = await axiosInstance.get<ResponseWrapper<TeacherCourseListResp>>(
    endpoints.course.list,
    {
      params,
    },
  );

  return resp.data;
};
