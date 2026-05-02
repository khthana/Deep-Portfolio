import { endpoints } from "../../../../configs/endpoints.config";
import { axiosInstance } from "../../../../lib/axios";
import type { ResponseWrapper } from "../../../../types/global-type";
import type { CreateCourseSectionScheduleReq } from "../types/course-type.type";

export const createCourseSectionSchedule = async (
  req: CreateCourseSectionScheduleReq,
) => {
  const resp = await axiosInstance.post<ResponseWrapper<any>>(
    endpoints.course.schedule,
    req,
  );

  return resp.data;
};
