import type {
  AttachmentDetailResp,
  AttachmentType,
} from "./attachment-type.type";

/**
 * `CourseDetail`, `CLOResp` and `PLOResp` used to be written out here. They now
 * come from @deep-portfolio/api-types, which apps/api is annotated against, so
 * import them from there — see docs/adr/0028-shared-api-types.md. What is left
 * in this file is the responses no one has moved yet.
 */

export type ScoreWeightResp = {
  // year: string;
  // semester: number;
  // subject_id: string;
  sequence_order: number;
  score_category: string;
  weight: number;
  created_at: string;
  updated_at: string;
  score_ratio_id: number;
};

export type LessonPlanResp = {
  year: string;
  semester: number;
  subject_id: string;
  week_no: number;
  description: string;
  remark: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  title: string;
  id: number;

  allActivities: string[];
};

export type AnnouncementDetailResp = {
  title: string;
  content: JSON;
  created_by: string;
  created_at: Date | null;
  updated_at: Date | null;
  published_at: Date | null;
  status: AttachmentType | null;
  is_pinned: boolean | null;
  view_count: number | null;
  announcement_id: number;
  attachments: AttachmentDetailResp | null;
};

//-------------------------------------------------
