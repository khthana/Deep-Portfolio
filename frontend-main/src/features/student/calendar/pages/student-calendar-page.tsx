import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { type GetStudentCalendarParams } from "../types/calendar-type";
import { daysOfWeek, monthNames } from "../../../../constants/date";
import Calendar from "../components/calendar";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../stores/stores";
import UpcomingEventsCard from "../components/upcoming-events-card";
import EventFilter from "../components/event-filter";
import PageLayout from "../../../../components/container/page-layout";
import WhiteContainer from "../../../../components/container/white-container";
import { fetchStudentCalendar } from "../stores/calendar-action";

const StudentCalendarPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const homeSlice = useSelector((state: RootState) => state.home);
  const calendarSlice = useSelector((state: RootState) => state.calendar);

  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth(),
  );

  const handleFetchData = async () => {
    const params: GetStudentCalendarParams = {
      student_id: homeSlice.studentId,
      semester: homeSlice.semester,
      academic_year: homeSlice.academicYear,
    };
    await dispatch(fetchStudentCalendar(params));
  };

  const handlePrevMonthOnClick = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setYear((prevYear) => prevYear - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonthOnClick = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setYear((prevYear) => prevYear + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const generateCalendar = useMemo(() => {
    const daysInMonthWithPadding = (): (number | null)[] => {
      const days: (number | null)[] = [];

      const firstDayOfMonth = new Date(year, selectedMonth, 1);
      const startDayOfWeek = firstDayOfMonth.getDay();
      const daysInThisMonth = new Date(year, selectedMonth + 1, 0).getDate();

      for (let i = startDayOfWeek - 1; i >= 0; i--) {
        days.push(null);
      }

      for (let d = 1; d <= daysInThisMonth; d++) {
        days.push(d);
      }

      const extraDaysNeeded = (7 - (days.length % 7)) % 7;
      for (let d = 1; d <= extraDaysNeeded; d++) {
        days.push(null);
      }

      return days;
    };

    const calendarDays = daysInMonthWithPadding();
    const calendarWeeks: (number | null)[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      calendarWeeks.push(calendarDays.slice(i, i + 7));
    }

    return (
      <Calendar
        calendarWeeks={calendarWeeks}
        selectedMonth={selectedMonth}
        year={year}
      />
    );
  }, [year, selectedMonth]);

  useEffect(() => {
    handleFetchData();
  }, [homeSlice.studentId, homeSlice.semester, homeSlice.academicYear]);

  return (
    <PageLayout>
      <WhiteContainer>
        <div className="pb-6 border-b border-light-grey flex justify-between">
          <div className="flex gap-3">
            <LeftOutlined
              className="cursor-pointer"
              onClick={handlePrevMonthOnClick}
            />
            <div className="body-bold-1">
              {monthNames[selectedMonth]} {year + 543}
            </div>
            <RightOutlined
              className="cursor-pointer"
              onClick={handleNextMonthOnClick}
            />
          </div>

          <EventFilter />
        </div>

        <div>
          <div
            className="grid grid-cols-7 divide-x divide-light-grey border-t border-x border-light-grey rounded-t-2xl"
            style={{ backgroundColor: "rgb(244, 99, 42, 0.15)" }}
          >
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="text-center p-4 caption-bold text-primary-orange"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="border-x border-b border-light-grey rounded-b-2xl">
            {generateCalendar}
          </div>
        </div>
      </WhiteContainer>

      <div className="flex flex-col gap-4">
        {calendarSlice.upcomingEvents.map((upcomingEvent, index) => (
          <UpcomingEventsCard key={index} upcomingEvent={upcomingEvent} />
        ))}
      </div>
    </PageLayout>
  );
};

export default StudentCalendarPage;
