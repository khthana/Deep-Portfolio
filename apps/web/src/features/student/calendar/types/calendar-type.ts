import type {
  CalendarEventResp,
  ClassworkDetail,
} from "@deep-portfolio/api-types";
import type { CourseDetailSummary } from "../../course/types/course-type";

export const EventType = {
  COURSE: "COURSE",
  ACTIVITY: "ACTIVITY",
  LEARNING_ACTIVITY: "LEARNING_ACTIVITY",
  HOLIDAY: "HOLIDAY",
} as const;

export const eventTypeLabel: Record<EventType, string> = {
  COURSE: "วิชาเรียน",
  ACTIVITY: "กิจกรรมการประเมิน",
  LEARNING_ACTIVITY: "กิจกรรมการเรียนรู้",
  HOLIDAY: "วันหยุด",
};

export const eventTypeColor: Record<EventType, string> = {
  COURSE: "orange", // ส้ม
  ACTIVITY: "blue", // default (จะ override ตาม status)
  LEARNING_ACTIVITY: "green", // เขียว
  HOLIDAY: "black", // เหลือง
};

// export const eventTypeColor: Record<EventType, string> = {
//   COURSE: "#F4632A", // ส้ม
//   ACTIVITY: "#FFFFFF", // default (จะ override ตาม status)
//   LEARNING_ACTIVITY: "#3B8B5C", // เขียว
//   HOLIDAY: "#2C3142", // เหลือง
// };

export type ActivityDetail = {
  name: string;
  room: string;
  date: string;
  startTime: string;
  endTime: string;
};

export type HolidayDetail = {
  name: string;
  date: string;
};

export type EventDetailItem =
  | { eventType: "COURSE"; eventDetail: CourseDetailSummary }
  | { eventType: "CLASSWORK"; eventDetail: ClassworkDetail }
  | { eventType: "ACTIVITY"; eventDetail: ActivityDetail }
  | { eventType: "HOLIDAY"; eventDetail: HolidayDetail };

export type CalendarEventItems = EventDetailItem[];

export type EventType = keyof typeof EventType;

export type UpcomingEvent = {
  date: string;
  // events: EventDetailItem[];
} & CalendarEventResp;

//------------------------------------------------

// CalendarEventResp, CalendarClassworkEvent and CalendarCourseEvent used to be
// declared here. They moved to @deep-portfolio/api-types (#68) — import them
// from there. Six fields this copy got wrong: a classwork event's `type` is the
// raw column, lower case and not narrowed to two values, and its `status` is
// the column, so it has GRADING and never LATE; and all four of a course
// event's schedule fields are nullable, because a section with no timetable row
// has none of them. `course` it had right — that key is never missing, for the
// reason ADR-0045 §8 spends a section on.

//------------------------------------------------

export type GetStudentCalendarParams = {
  student_id: string;
  semester: string;
  academic_year: string;
};
