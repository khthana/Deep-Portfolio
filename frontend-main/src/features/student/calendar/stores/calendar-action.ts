import { createAsyncThunk } from "@reduxjs/toolkit";
import type { ResponseWrapper } from "../../../../types/global-type";
import { getStudentCalendar } from "../services/calendar-service.service";
import type {
  CalendarEventResp,
  GetStudentCalendarParams,
} from "../types/calendar-type";

export const fetchStudentCalendar = createAsyncThunk<
  ResponseWrapper<CalendarEventResp>,
  GetStudentCalendarParams
>("student/calendar", getStudentCalendar);
