import { Prisma } from "@prisma/client";
import type { AttachmentDetailResp } from "@deep-portfolio/api-types";
import type {
  CreateLearningActivityBody,
  UpdateLearningActivityBody,
} from "../validation/learning-activity.schema";

/** What the schema checked, plus the files multer took off the same request. */
export type CreateLearningActivityReqBody = CreateLearningActivityBody & {
  files: Express.Multer.File[];
};

export type UpdateLearningActivityReqBody = UpdateLearningActivityBody & {
  files: Express.Multer.File[];
};

//-------------------------------------

export type GetLearningActivityDetailResp = {
  attachments: AttachmentDetailResp;
  // week_no: number | undefined;
  learning_activity_type: string;
  learning_activity_id: number;
  learning_activity_name: string;
  created_at: Date | null;
  updated_at: Date | null;
  announcement_date: Date | null;
  deadline_date: Date | null;
  course_syllabus_id: number;
  section_id: number;
  detail: Prisma.InputJsonValue;
};

//-------------------------------------

export type GetAllLearningActivityList = {
  id: number;
  learning_activity_name: string;
  announcement_date: Date | null;
  deadline_date: Date | null;
  section_id: number | null;
  week_no: number | undefined;

  submitted_count: number | null;
  pending_grading_count: number | null;
  student_count: number | null;
};
