import { Weekday } from "../models/course.model";

export const sortByDate = (courses: any[]) => {
  const dayOrder = {
    MON: 1,
    TUE: 2,
    WED: 3,
    THU: 4,
    FRI: 5,
    SAT: 6,
    SUN: 7,
  };

  courses.sort((a, b) => {
    const dayA = a.day_of_week ? dayOrder[a.day_of_week as Weekday] : 8;
    const dayB = b.day_of_week ? dayOrder[b.day_of_week as Weekday] : 8;

    if (dayA !== dayB) {
      return dayA - dayB;
    }

    return (a.start_time ?? "").localeCompare(b.start_time ?? "");
  });

  return courses;
};
