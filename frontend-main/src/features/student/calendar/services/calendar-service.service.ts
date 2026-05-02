import { endpoints } from "../../../../configs/endpoints.config";
import { axiosInstance } from "../../../../lib/axios";
import type { ResponseWrapper } from "../../../../types/global-type";
import type {
  CalendarEventResp,
  GetStudentCalendarParams,
} from "../types/calendar-type";

export const getStudentCalendar = async (params: GetStudentCalendarParams) => {
  const resp = await axiosInstance.get<ResponseWrapper<CalendarEventResp>>(
    endpoints.student.calendar,
    { params },
  );

  return resp.data;
};
