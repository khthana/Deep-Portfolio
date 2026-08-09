import { Weekday } from "../models/course.model";

/**
 * Timetable order: by weekday, then by the time the class starts.
 *
 * The parameter is generic over the two fields it reads rather than typed to
 * one response shape, because it is called on several — what they have in
 * common is a slot in the week, not a table. Sorting is in place, as
 * `Array.prototype.sort` is, and the same array is handed back for chaining.
 */
type Scheduled = {
  day_of_week?: string | null;
  start_time?: string | null;
};

export const sortByDate = <T extends Scheduled>(courses: T[]): T[] => {
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
