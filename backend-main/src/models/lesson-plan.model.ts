import { CourseMaterialDetail } from "./course-material.model";

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

export type GetStudentLessonPlanWithMaterialResp = {
  allActivities: string[];
  course_materials: CourseMaterialDetail | null;
  week_no: number;
  description: string | null;
  remark: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  title: string | null;
  created_by: string | null;
  section_id: number | null;
  id: number;
};
