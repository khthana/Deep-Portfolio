import { CourseMaterialDetail } from "./course-material.model";

/** Stated once, by the schemas that check it. */
export type {
  AddLessonPlanBody,
  UpdateLessonPlanBody,
} from "../validation/lesson-plan.schema";

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
