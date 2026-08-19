import type { AttachmentType } from "./attachment-type.type";
import type { AttachmentDetailResp } from "@deep-portfolio/api-types";

/**
 * `CourseDetail`, `CLOResp` and `PLOResp` used to be written out here. They now
 * come from @deep-portfolio/api-types, which apps/api is annotated against, so
 * import them from there — see docs/adr/0028-shared-api-types.md. What is left
 * in this file is the responses no one has moved yet.
 */

// ScoreWeightResp used to be declared here. It moved to
// @deep-portfolio/api-types as `ScoreWeightDetail` (#68), which the activity
// pass had already written from the same row — import it from there. Three
// things it said were wrong: `section_id` was missing, `weight` refused the
// null the column takes, and both dates refused null too.

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
