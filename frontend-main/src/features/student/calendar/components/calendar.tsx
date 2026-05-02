import { useEffect, useMemo, useState, type JSX } from "react";
import {
  EventType,
  type CalendarEventItems,
  type CalendarEventResp,
  type UpcomingEvent,
} from "../types/calendar-type";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import { calendarSliceAction } from "../stores/calendar-slice";
import { dayArray } from "../../../../constants/date";
import CourseEvent from "./course-event";
import { isSameDay } from "../../../../utils/format-thai-date";
import ActivityEvent from "./activity-event";
import LearningActivityEvent from "./learning-activity-event";

type Props = {
  calendarWeeks: (number | null)[][];
  calendarEventItems?: CalendarEventItems;
  selectedMonth: number;
  year: number;
};

const Calendar = (props: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const calendarSlice = useSelector((state: RootState) => state.calendar);

  const [today] = useState(new Date());

  const calendarEventItems = useMemo(() => {
    return calendarSlice.calendarEventItems;
  }, [calendarSlice.calendarEventItems]);

  const getEventsByDate = (date: Date) => {
    const dayOfWeek = date.getDay();

    const courseEvents = calendarEventItems?.courses.filter((event) => {
      return event.day_of_week === dayArray[dayOfWeek];
    });

    const activityEvents = calendarEventItems?.activities.filter((event) => {
      return (
        event.deadline_date && isSameDay(new Date(event.deadline_date), date)
      );
    });

    const learningActivityEvents =
      calendarEventItems?.learning_activities.filter((event) => {
        return (
          event.deadline_date && isSameDay(new Date(event.deadline_date), date)
        );
      });

    const events = {
      activities: activityEvents ?? [],
      learning_activities: learningActivityEvents ?? [],
      courses: courseEvents ?? [],
    };

    return events;
  };

  const upcomingEvents: UpcomingEvent[] = useMemo(() => {
    const result: UpcomingEvent[] = [];
    const d = new Date(today);
    let checkedDays = 0;
    // handle กรณีปิดเทอม ไม่มี event เลย จะได้ไม่ติดลูป กำหนดไว้ที่ 30 วัน
    while (result.length < 7 && checkedDays < 30) {
      const currentDate = new Date(d);
      const events = getEventsByDate(currentDate);

      if (
        events.courses.length > 0 ||
        events.activities.length > 0 ||
        events.learning_activities.length > 0
      ) {
        result.push({
          date: currentDate.toISOString(),
          ...events,
        });
      }

      d.setDate(d.getDate() + 1);
      checkedDays++;
    }

    return result;
  }, [calendarEventItems, today]);

  useEffect(() => {
    if (
      JSON.stringify(upcomingEvents) !==
      JSON.stringify(calendarSlice.upcomingEvents)
    ) {
      dispatch(calendarSliceAction.setUpcomingEvents(upcomingEvents));
    }
  }, [upcomingEvents, calendarSlice.upcomingEvents, dispatch]);

  return props.calendarWeeks.map((week, weekIndex) => (
    <div
      className="grid grid-cols-7 divide-x border-t border-light-grey divide-light-grey"
      key={`week-${weekIndex}`}
    >
      {week.map((day, dayIndex) => {
        const isToday =
          today.getMonth() === props.selectedMonth &&
          today.getDate() === day &&
          today.getFullYear() === props.year;

        let events: CalendarEventResp | null = null;
        const allEvents: JSX.Element[] = [];

        if (day) {
          const date = new Date(props.year, props.selectedMonth, day);
          events = getEventsByDate(date);

          if (events) {
            if (calendarSlice.eventFilter.includes(EventType.COURSE)) {
              events.courses.forEach((course, index) => {
                allEvents.push(
                  <CourseEvent courseDetail={course} key={`course-${index}`} />,
                );
              });
            }

            if (calendarSlice.eventFilter.includes(EventType.ACTIVITY)) {
              events.activities.forEach((activity, index) => {
                allEvents.push(
                  <ActivityEvent
                    classworkDetail={activity}
                    key={`activity-${index}`}
                  />,
                );
              });
            }
            if (
              calendarSlice.eventFilter.includes(EventType.LEARNING_ACTIVITY)
            ) {
              events.learning_activities.forEach((activity, index) => {
                allEvents.push(
                  <LearningActivityEvent
                    classworkDetail={activity}
                    key={`learning-${index}`}
                  />,
                );
              });
            }
          }
        }

        const displayEvents = allEvents.slice(0, 4);
        const remainingEvents = allEvents.length - 4;

        return (
          <div
            key={dayIndex}
            className="h-35 px-2 pt-2 pb-4 flex flex-col items-center caption-bold"
          >
            <div
              className={`py-2 px-3 ${
                isToday && "bg-primary-orange text-white rounded-[50px]"
              }`}
            >
              {day}
            </div>

            <div className="w-full space-y-1 mb-1">
              {displayEvents}
              {remainingEvents > 0 && (
                <div className="text-[10px] text-right font-bold text-primary-orange">
                  และอีก {remainingEvents} รายการ
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  ));
};

export default Calendar;
