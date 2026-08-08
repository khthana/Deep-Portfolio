export type AddLessonPlanBody = {
  year: string;
  semester: number;
  subject_id: string;
  week_no: number;
  title: string;
  description?: string;
  remark?: string;
  created_by: string;
  section_id: number;
};

export type UpdateLessonPlanBody = {
  lesson_plan_id: number;
  title: string;
  description?: string;
  remark?: string;
};

export type GetLessonPlanParams = {
  course_id: string;
  teacher_id: string;
};
