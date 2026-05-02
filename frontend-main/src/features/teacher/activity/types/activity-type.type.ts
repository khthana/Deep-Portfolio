import type { JSONContent } from "@tiptap/react";
import type { AttachmentDetailItem } from "../../announcement/types/announement-type";
import type { AttachmentDetailResp } from "../../../../types/attachment-type.type";
import type {
  ScoreWeightDetail,
  StudentActivityStatusDB,
} from "../../../../types/activity-type.type";
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

export type SubmissionStatus = "GRADED" | "PENDING";

export const submissionStatusLabel: Record<SubmissionStatus, string> = {
  GRADED: "ตรวจแล้ว",
  PENDING: "ยังไม่ตรวจ",
};

export const submissionStatusBGColor: Record<SubmissionStatus, string> = {
  GRADED: "rgb(59,139,92,0.2)", // เขียว
  PENDING: "rgb(241,188,65,0.2)", // เหลือง
};

export const submissionStatusTextColor: Record<SubmissionStatus, string> = {
  GRADED: "#3B8B5C", // เขียว
  PENDING: "#C39939", // เหลือง
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

export type GetAllActivityList = {
  id: number;
  activity_type: ClassworkType;
  activity_name: string;
  announcement_date: Date | null;
  deadline_date: Date | null;
  section_id: number | null;
  subject_score_ratio?: ScoreWeightDetail;

  submitted_count: number | null;
  pending_grading_count: number | null;
  student_count: number | null;
};

//----------------------------------------------

// export type GetAllSubmittedActivityByActivityIdResp = {
//   submitted_detail: SubmittedDetail[];
//   activity_id: number;
//   activity_name: string;
//   score: number | null;
//   deadline_date: Date | null;
// };

// export type SubmittedDetail = {
//   status: StudentActivityStatusDB;
//   id: number;
//   is_bookmark: boolean;
//   score: number | null;
//   feedback: string | null;
//   submitted_at: Date | null;
//   student: {
//     student_id: string;
//     first_name_th: string;
//     last_name_th: string;
//   };
// };

export type GetAllSubmittedActivityByActivityIdResp = {
  activity_id: number;
  activity_name: string;
  deadline_date: Date | null;
  score: number | null;
  submissions: Submission[];
};

export type Submission = {
  submission_type: ClassworkType;
  status: StudentActivityStatusDB;
  submitted_at: Date | null;
  score: number | null;
  feedback: string | null;
  remark: string | null;
  is_bookmark: boolean;
  id: number;

  student?: {
    student_id: string;
    first_name_th: string;
    last_name_th: string;
  };

  group?: {
    group_id: number;
    members: {
      student_id: string;
      first_name_th: string;
      last_name_th: string;
    }[];
  };
};

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

export type GradeStudentActivityResp = {
  student_activity_id: number;
  total_score: number;
};

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
