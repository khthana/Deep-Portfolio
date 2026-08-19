// `CourseMaterialDetail` is borrowed, not owned: the lesson plan embeds what
// the material feature answers. That feature moved in #68 and this file
// follows it here rather than waiting for its own pass (ADR-0029 §4). The
// rest of this type is still the lesson plan's own, and still written twice.
import type { CourseMaterialDetail } from "@deep-portfolio/api-types";

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
