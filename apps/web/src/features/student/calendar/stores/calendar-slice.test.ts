import { describe, expect, it } from "vitest";
import { calendarSlice, calendarSliceAction } from "./calendar-slice";
import { fetchStudentCalendar } from "./calendar-action";
import {
  EventType,
  type CalendarEventResp,
  type UpcomingEvent,
} from "../types/calendar-type";
import {
  failed,
  initialStateOf,
  responded,
  started,
} from "../../../../test/slice-cases";

/**
 * The student's calendar page.
 *
 * One request, which brings back the three lists the month view draws from,
 * and two setters the page uses to remember what the reader is looking at:
 * which event kinds are ticked in the filter, and the "upcoming" list it
 * derives from the response for the sidebar.
 */

const reducer = calendarSlice.reducer;
const initialState = initialStateOf(reducer);

const calendar: CalendarEventResp = {
  activities: [
    {
      id: 1,
      name: "งานที่หนึ่ง",
      deadline_date: "2024-01-05T13:45:00.000Z",
      type: "INDIVIDUAL",
      status: "NOT_SUBMITTED",
      course: "Software Engineering",
    },
  ],
  learning_activities: [],
  courses: [
    {
      id: 10,
      name: "Software Engineering",
      day_of_week: "WED",
      start_time: "13:00",
      end_time: "16:00",
      classroom: "ECC-505",
    },
  ],
};

describe("calendarSlice", () => {
  it("starts with every event kind ticked but holidays", () => {
    // The filter is what the page renders from, so its default is the default
    // view. HOLIDAY is the one EventType left out — nothing supplies holidays
    // yet.
    expect(initialState.eventFilter).toEqual([
      EventType.ACTIVITY,
      EventType.LEARNING_ACTIVITY,
      EventType.COURSE,
    ]);
    expect(initialState.calendarEventItems).toBeNull();
    expect(initialState.upcomingEvents).toEqual([]);
  });

  describe("fetchStudentCalendar", () => {
    it("raises the loading flag while the month is being fetched", () => {
      expect(reducer(initialState, started(fetchStudentCalendar))).toEqual({
        ...initialState,
        fetchStudentCalendarLoading: true,
      });
    });

    it("keeps the response whole for the page to lay out", () => {
      const pending = reducer(initialState, started(fetchStudentCalendar));

      const fulfilled = reducer(
        pending,
        responded(fetchStudentCalendar, calendar),
      );

      expect(fulfilled).toEqual({
        ...initialState,
        calendarEventItems: calendar,
      });
    });

    it("replaces the previous month rather than merging into it", () => {
      const first = reducer(
        initialState,
        responded(fetchStudentCalendar, calendar),
      );
      const empty: CalendarEventResp = {
        activities: [],
        learning_activities: [],
        courses: [],
      };

      const second = reducer(first, responded(fetchStudentCalendar, empty));

      expect(second.calendarEventItems).toEqual(empty);
    });

    it("records the failure and leaves the month showing what it had", () => {
      const loaded = reducer(
        initialState,
        responded(fetchStudentCalendar, calendar),
      );

      const rejected = reducer(
        loaded,
        failed(fetchStudentCalendar, "โหลดปฏิทินไม่สำเร็จ"),
      );

      expect(rejected.error).toBe("โหลดปฏิทินไม่สำเร็จ");
      expect(rejected.calendarEventItems).toEqual(calendar);
    });
  });

  describe("setUpcomingEvents", () => {
    it("stores the list the sidebar was given", () => {
      const upcoming: UpcomingEvent[] = [{ date: "2024-01-05", ...calendar }];

      const next = reducer(
        initialState,
        calendarSliceAction.setUpcomingEvents(upcoming),
      );

      expect(next.upcomingEvents).toEqual(upcoming);
    });

    it("can be emptied", () => {
      const filled = reducer(
        initialState,
        calendarSliceAction.setUpcomingEvents([
          { date: "2024-01-05", ...calendar },
        ]),
      );

      expect(
        reducer(filled, calendarSliceAction.setUpcomingEvents([]))
          .upcomingEvents,
      ).toEqual([]);
    });
  });

  describe("setEventFilter", () => {
    it("replaces the whole tick list rather than toggling one kind", () => {
      const next = reducer(
        initialState,
        calendarSliceAction.setEventFilter([EventType.COURSE]),
      );

      expect(next.eventFilter).toEqual([EventType.COURSE]);
    });

    it("accepts an empty filter, which is how the page shows nothing", () => {
      expect(
        reducer(initialState, calendarSliceAction.setEventFilter([]))
          .eventFilter,
      ).toEqual([]);
    });
  });
});
