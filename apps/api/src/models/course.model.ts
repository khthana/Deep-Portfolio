export type CourseDetail = {
  // Null together, and only when the section has nobody teaching it yet — an
  // ordinary state for a section that has just been imported, not a broken
  // row. See docs/adr/0021-section-without-teacher.md.
  teacher_name_th: string | null;
  teacher_name_en: string | null;
  teacher_email: string | null;
  teacher_phone: string | null;
  teacher_id: string | null;
  section_id: number;
  section_number: string;
  course_name_th: string;
  course_name_en: string;
  course_id: string;
  credits: number;
  course_desc_th: string;
  course_desc_en: string;
  academic_year: string;
  semester: number;
  program_id: string;

  day_of_week: Weekday | null;
  start_time: string | null;
  end_time: string | null;
  classroom: string | null;
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

export type Weekday = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

//-------------------------------------

export type { CreateCourseSectionScheduleReq } from "../validation/course.schema";
