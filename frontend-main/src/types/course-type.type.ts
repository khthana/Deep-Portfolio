import type { Weekday } from "../constants/date";
import type {
  AttachmentDetailResp,
  AttachmentType,
} from "./attachment-type.type";

export type CourseDetail = {
  teacher_name_th: string;
  teacher_name_en: string;
  teacher_email: string;
  teacher_phone: string;
  teacher_id: string;
  section_id: number;
  section_number: string;
  course_name_th: string;
  course_name_en: string;
  course_id: string;
  credits: number;
  course_desc_th: string;
  course_desc_en: string;
  academic_year: string;
  semester: number;
  program_id: string;

  day_of_week: Weekday | null;
  start_time: string | null;
  end_time: string | null;
  classroom: string | null;
};

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

export type PLOResp = {
  created_at: Date | null;
  updated_at: Date | null;
  created_by: string | null;
  outcome_id: number;
  program_id: string;
  outcome_code: string;
  outcome_title: string;
  outcome_description: string | null;
  outcome_type: string;
  parent_outcome_id: number | null;
  sequence_order: number;
  level_depth: number | null;
  is_expanded: boolean | null;
  is_active: boolean | null;
  updated_by: string | null;
};

export type CLOResp = {
  outcome_code: string;
  outcome_title: string;
  outcome_description: string;
  clo_id: number;
  clo_number: string;
  clo_detail: string;
  teaching_method: string | null;
  assessment_method: string | null;
  created_at: Date;
  updated_at: Date;
  section_id: number;
  plo_id: number;
  created_by: string | null;
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
