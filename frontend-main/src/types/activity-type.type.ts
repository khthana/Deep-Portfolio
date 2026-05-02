import type { JSONContent } from "@tiptap/react";
import type { activityType } from "../features/teacher/activity/types/activity-type.type";
import type { AttachmentDetailResp } from "./attachment-type.type";

export type GetActivityDetailResp = {
  activity_id: number;
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

  rubric_activity_mapping: RubricDetail[];
  attachments: AttachmentDetailResp | null;
  subject_score_ratio: ScoreWeightDetail;
};

export type RubricDetail = {
  id: number;
  weight: number;
  activity_id: number;
  criteria: string;

  rubric_levels: RubricLevel[];
};

export type RubricLevel = {
  description: string;
  id: number;
  rubric_id: number;
  level_no: number;
};

export type ScoreWeightDetail = {
  score_ratio_id: number;
  sequence_order: number;
  score_category: string;
  weight: number;
  section_id: number;
};

export type GetLearningActivityDetailResp = {
  week_no: number | undefined;
  learning_activity_type: "INDIVIDUAL" | "GROUP";
  learning_activity_name: string;
  created_at: Date | null;
  updated_at: Date | null;
  announcement_date: Date | null;
  deadline_date: Date | null;
  course_syllabus_id: number | null;
  section_id: number;
  detail: JSONContent | null;
  learning_activity_id: number;

  attachments: AttachmentDetailResp | null;
};

export type StudentActivityStatusDB =
  | "NOT_SUBMITTED"
  | "SUBMITTED"
  | "GRADED"
  | "GRADING";
