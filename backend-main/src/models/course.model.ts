export type CourseDetail = {
  teacher_name_th: string;
  teacher_name_en: string;
  teacher_email: string;
  teacher_phone: string;
  teacher_id: string;
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

export type CreateCourseSectionScheduleReq = {
  section_id: number;
  day_of_week: Weekday;
  start_time: string;
  end_time: string;
  classroom: string;
};
