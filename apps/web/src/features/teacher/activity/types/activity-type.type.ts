import type { JSONContent } from "@tiptap/react";
import type { AttachmentDetailItem } from "../../announcement/types/announement-type";
import type { ClassworkType } from "../../../student/course/types/course-type";

export const activityType = {
  GROUP: "GROUP",
  INDIVIDUAL: "INDIVIDUAL",
} as const;

export const activityTypeLabel: Record<activityType, string> = {
  GROUP: "งานกลุ่ม",
  INDIVIDUAL: "งานเดี่ยว",
};

export const activityTypeOptions = Object.keys(activityType).map((key) => ({
  value: activityType[key as activityType],
  label: activityTypeLabel[key as activityType],
}));

export type activityType = keyof typeof activityType;

/**
 * What a row of a marking table can say about itself. Narrower than the API's
 * four statuses on purpose — see formatSubmissionStatus, which is the only thing
 * that should produce one of these.
 */
export type SubmissionStatus = "GRADED" | "PENDING" | "NOT_SUBMITTED";

export const submissionStatusLabel: Record<SubmissionStatus, string> = {
  GRADED: "ตรวจแล้ว",
  PENDING: "ยังไม่ตรวจ",
  NOT_SUBMITTED: "ยังไม่ส่ง",
};

export const submissionStatusBGColor: Record<SubmissionStatus, string> = {
  GRADED: "rgb(59,139,92,0.2)", // เขียว
  PENDING: "rgb(241,188,65,0.2)", // เหลือง
  // Grey rather than another warm colour: work that does not exist is not work
  // waiting on the teacher, so it should not compete with PENDING for attention.
  NOT_SUBMITTED: "rgb(107,114,128,0.15)", // เทา
};

export const submissionStatusTextColor: Record<SubmissionStatus, string> = {
  GRADED: "#3B8B5C", // เขียว
  PENDING: "#C39939", // เหลือง
  NOT_SUBMITTED: "#6B7280", // เทา
};

export type FileData = {
  id: number;
  title: string;
  date: string;
  time: string;
  src: string;
};

//-----------------------------------------

export type CreateActivityFormType = {
  announcement_date: Date;
  deadline_date: Date;
  course_syllabus_id: number;
  activity_name: string;
  score_number: number;
  activity_type: string;
  score_ratio_id: number;
  detail: JSONContent;
  is_average_score: boolean;
  is_self_assessment: boolean;

  attachments: AttachmentDetailItem[];
};

//---------------------------------------------

// GetAllActivityList used to be declared here. It moved to
// @deep-portfolio/api-types as ActivityListItem (#68) — the endpoint answers a
// list and this is one row of it, which the old name did not say. Its
// `subject_score_ratio` was optional here and nullable there, which is what the
// endpoint actually sends, and its three counts are never null. See ADR-0032.

//----------------------------------------------

// GetAllSubmittedActivityByActivityIdResp and Submission used to be declared
// here. They moved to @deep-portfolio/api-types (#68) — import
// ActivitySubmissionListResp and ActivitySubmission from there. The row is a
// union on submission_type now rather than one row with `student` and `group`
// both optional, so a reader narrows once and gets the half that is really
// there; the dates say string. See ADR-0034.

export type GradeStudentActivityData = {
  activity_id: number;
  student_id: string;
  activity_type: ClassworkType;
  student_activity_id: number;
  feedback: string;
  remark: string;
  full_score: number;
  total_level: number;
  rubric_detail: {
    rubric_id: number;
    rubric_level_id: number;
    rubric_level_no: number;
  }[];
};

// GradeStudentActivityResp used to be declared here. It moved to
// @deep-portfolio/api-types (#68) — the same two fields, now bound to both
// gradeStudentActivity and gradeStudentGroupActivity on the API side.

export type GradingFormType = {
  feedback: string;
  remark: string;
  rubric_detail: {
    rubric_id: number;
    rubric_level_id: number;
    rubric_level_no: number;
  }[];
};

//--------------------------------------------

export type AddStudentActivityToBookmark = {
  activity_type: ClassworkType;
  student_activity_id: number;
  is_bookmark: boolean;
};
