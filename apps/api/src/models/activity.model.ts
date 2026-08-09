import { Prisma } from "@prisma/client";
import { AttachmentDetailResp } from "./announcement.model";
import { ClassworkType } from "./student.model";
import type {
  CreateActivityBody,
  UpdateActivityBody,
} from "../validation/activity.schema";

/** What the schema checked, plus the files multer took off the same request. */
export type CreateActivityReqBody = CreateActivityBody & {
  files: Express.Multer.File[];
};

export type UpdateActivityReqBody = UpdateActivityBody & {
  files: Express.Multer.File[];
};

//-------------------------------------

export type GetActivityDetailResp = {
  activity_id: number;
  activity_type: ClassworkType;
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
  detail: Prisma.InputJsonValue | null;
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

//-------------------------------------

export type GetAllActivityList = {
  id: number;
  activity_type: ClassworkType;
  activity_name: string;
  announcement_date: Date | null;
  deadline_date: Date | null;
  section_id: number | null;
  subject_score_ratio: ScoreWeightDetail;

  submitted_count: number | null;
  pending_grading_count: number | null;
  student_count: number | null;
};
