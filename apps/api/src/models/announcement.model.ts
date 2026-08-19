import { $Enums, Prisma } from "@prisma/client";
import type { AttachmentDetailResp } from "@deep-portfolio/api-types";
import type { CreateAnnouncementBody } from "../validation/announcement.schema";

/**
 * What the service is given: the validated body, the files multer put on the
 * request, and the author — which comes from the session rather than from the
 * body (#30). All three arrive by different routes and only meet here.
 */
export type CreateAnnouncementReqBody = CreateAnnouncementBody & {
  files: Express.Multer.File[];
  created_by: string;
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
