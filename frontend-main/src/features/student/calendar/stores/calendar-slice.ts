import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import {
  EventType,
  type CalendarEventResp,
  type UpcomingEvent,
} from "../types/calendar-type";
import { fetchStudentCalendar } from "./calendar-action";

type CalendarSlice = {
  upcomingEvents: UpcomingEvent[];
  eventFilter: EventType[];

  calendarEventItems: CalendarEventResp | null;

  fetchStudentCalendarLoading: boolean;
  error: string | null;
};

const initialState: CalendarSlice = {
  upcomingEvents: [],
  eventFilter: [
    EventType.ACTIVITY,
    EventType.LEARNING_ACTIVITY,
    EventType.COURSE,
  ],

  calendarEventItems: null,

  fetchStudentCalendarLoading: false,
  error: null,
};

export const calendarSlice = createSlice({
  name: "calendar",
  initialState,
  reducers: {
    setUpcomingEvents(state, action: PayloadAction<UpcomingEvent[]>) {
      state.upcomingEvents = action.payload;
    },
    setEventFilter(state, action: PayloadAction<EventType[]>) {
      state.eventFilter = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentCalendar.pending, (state) => {
        state.fetchStudentCalendarLoading = true;
      })
      .addCase(fetchStudentCalendar.fulfilled, (state, action) => {
        state.fetchStudentCalendarLoading = false;
        state.calendarEventItems = action.payload.data;
      })
      .addCase(fetchStudentCalendar.rejected, (state, action) => {
        state.fetchStudentCalendarLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });
  },
});

export const calendarSliceAction = calendarSlice.actions;
