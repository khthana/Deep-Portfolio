import type { CalendarEventResp } from "@deep-portfolio/api-types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { ResponseWrapper } from "../../../../types/global-type";
import { getStudentCalendar } from "../services/calendar-service.service";
import type { GetStudentCalendarParams } from "../types/calendar-type";

export const fetchStudentCalendar = createAsyncThunk<
  ResponseWrapper<CalendarEventResp>,
  GetStudentCalendarParams
>("student/calendar", getStudentCalendar);
