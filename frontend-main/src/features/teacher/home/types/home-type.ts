import type { Weekday } from "../../../../constants/date";

export type GetCourseDetailParams = {
  secId: string;
};

export type GetAllCoursesParams = {
  academic_year: string;
  semester: number;
  teacher_id: string;
};

export type TeacherCourseListResp = {
  teacher_id: string;
  active_courses: CourseDetailBrief[];
  archived_courses: CourseDetailBrief[];
};

export type CourseDetailBrief = {
  // todo: add dayOfWeek, startTime, endTime
  section_number: string;
  section_id: number;
  course_name_th: string;
  course_name_en: string;
  course_id: string;
  academic_year: string;
  semester: number;

  day_of_week: Weekday | null;
  start_time: string | null;
  end_time: string | null;
  classroom: string | null;
};
