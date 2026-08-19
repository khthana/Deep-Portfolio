/**
 * `CourseDetail`, `CLOResp` and `PLOResp` used to be written out here. They now
 * come from @deep-portfolio/api-types, which apps/api is annotated against, so
 * import them from there — see docs/adr/0028-shared-api-types.md. What is left
 * in this file is `LessonPlanResp` and nothing else — the lesson plan has not
 * had its pass yet, and it is the last thing standing between this file and
 * deletion (#68).
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

// AnnouncementDetailResp used to be declared here. It moved to
// @deep-portfolio/api-types (#68) — import it from there. What it said that the
// endpoint does not: `status` was `AttachmentType`, which is the enum of what a
// file is, not the `draft | published | archived` the column holds; `content`
// was the global `JSON` type; `section_id` was missing; `attachments` is never
// null; and the three dates arrive as strings. See ADR-0037.

//-------------------------------------------------
