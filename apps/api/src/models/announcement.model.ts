import { $Enums, Prisma } from "@prisma/client";
import type { CreateAnnouncementBody } from "../validation/announcement.schema";

/**
 * What the service is given: the validated body, plus the files multer put on
 * the request. Those two arrive by different routes and only meet here.
 */
export type CreateAnnouncementReqBody = CreateAnnouncementBody & {
  files: Express.Multer.File[];
};

export type UploadFileDetail = {
  title: string;
  uploaded_by: string;
  file_path: string;
  original_filename: string;
  file_size: number;
  file_type: string;
};

//--------------------------------------

export type AnnouncementDetailResp = {
  title: string;
  content: Prisma.JsonValue;
  created_by: string;
  created_at: Date | null;
  updated_at: Date | null;
  published_at: Date | null;
  status: $Enums.announcement_status | null;
  is_pinned: boolean | null;
  view_count: number | null;
  announcement_id: number;
  attachments: AttachmentDetailResp | null;
};

export type AttachmentDetailResp = {
  file: FileDetail[];
  url: URLDetail[];
};

export type FileDetail = {
  attachment_id: number;
  title: string;
  file_path: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  uploaded_at: Date | null;
};

export type URLDetail = {
  attachment_id: number;
  title: string;
  url: string;
  uploaded_at: Date | null;
};
