import type { JSONContent } from "@tiptap/react";
import type { activityType } from "../../activity/types/activity-type.type";

export type ActivityFormType = {
  activity: string;
  weight: number;
};

export type CreateActivityCLOMappingBodyReq = {
  activity_id: number;
  clo_id: number;
  weight: number;
};

export type ActivityMappingDetailResp = {
  id: number;
  activity_type: activityType;
  activity_name: string;
  description: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  score_number: number | null;
  announcement_date: Date | null;
  deadline_date: Date | null;
  course_syllabus_id: number | null;
  is_average_score: boolean;
  is_self_assessment: boolean;
  detail: JSONContent | null;
  section_id: number | null;
  score_ratio_id: number | null;

  sequence_order?: number;
  score_category?: string;
  weight?: number | null;
  expected_level?: number;

  level_no?: number;
};

//----------------------------------------------------------

export type LearningActivityFormType = {
  learning_activity: string;
};

export type CreateLearningActivityCLOMappingBodyReq = {
  learning_activity_id: number;
  clo_id: number;
};

export type LearningActivityDetail = {
  week_no: number | undefined;
  learning_activity_type: string;
  learning_activity_name: string;
  created_at: Date | null;
  updated_at: Date | null;
  announcement_date: Date | null;
  deadline_date: Date | null;
  course_syllabus_id: number | null;
  section_id: number;
  detail: JSONContent | null;
  id: number;
};
