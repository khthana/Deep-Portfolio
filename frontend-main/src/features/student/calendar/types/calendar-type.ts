import type { Weekday } from "../../../../constants/date";
import type {
  ClassworkDetail,
  ClassworkStatus,
  ClassworkType,
  CourseDetailSummary,
} from "../../course/types/course-type";

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

export type CalendarEventResp = {
  activities: CalendarClassworkEvent[];
  learning_activities: CalendarClassworkEvent[];
  courses: CalendarCourseEvent[];
};

export type CalendarClassworkEvent = {
  id: number;
  name: string;
  deadline_date: string | null;
  type: ClassworkType;
  status: ClassworkStatus;
  course: string;
};

export type CalendarCourseEvent = {
  id: number;
  name: string;
  // start_date: Date;
  // end_date: Date;
  day_of_week: Weekday;
  start_time: string;
  end_time: string;
  classroom: string;
};

//------------------------------------------------

export type GetStudentCalendarParams = {
  student_id: string;
  semester: string;
  academic_year: string;
};
