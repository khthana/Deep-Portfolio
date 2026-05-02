import { Prisma } from "@prisma/client";
import { UploadURLDetail } from "./attachments.model";
import { AttachmentDetailResp } from "./announcement.model";
import { ScoreWeightDetail } from "./activity.model";
import { ClassworkType } from "./student.model";

export type CreateLearningActivityReqBody = {
  announcement_date: Date;
  deadline_date: Date;
  course_syllabus_id: number;
  learning_activity_name: string;
  learning_activity_type: string;
  detail?: Prisma.InputJsonValue;
  section_id: number;

  urls: UploadURLDetail[];
  files: Express.Multer.File[];
};

export type UpdateLearningActivityReqBody = {
  learning_activity_id: number;
  remove_attachment_ids: number[];
} & CreateLearningActivityReqBody;

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
