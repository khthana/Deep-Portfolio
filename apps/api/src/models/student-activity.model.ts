import { Prisma } from "@prisma/client";
import { AttachmentDetailResp } from "./announcement.model";
import { ClassworkType } from "./student.model";
import { GetActivityDetailResp } from "./activity.model";

export type AddStudentActivity = {
  student_id: string;
  activity_id: number;
};

export type GetAllStudentActivity = {
  activity_type: ClassworkType;
  id: number;
  score_ratio_id: number | null;
  activity_name: string;
  score_number: number | null;
  deadline_date: Date | null;
  announcement_date: Date | null;
  created_at?: Date | null;
  updated_at?: Date | null;
  section_id?: number | null;
  sequence_order?: number;
  score_category?: string;
  weight?: number | null;
  detail: Prisma.JsonValue;

  student_activity: StudentActivityBrief[];
  attachments: AttachmentDetailResp;
};

type StudentActivityBrief = {
  status: StudentActivityStatus;
  id: number;
  received_point: number | null;
};

export type StudentActivityStatus =
  | "NOT_SUBMITTED"
  | "SUBMITTED"
  | "GRADED"
  | "LATE";

export type StudentActivityStatusDB =
  | "NOT_SUBMITTED"
  | "SUBMITTED"
  | "GRADED"
  | "GRADING";

//-----------------------------------

export type GetStudentActivityDetail = {
  id: number;
  activity_id: number;
  student_id: string;
  status: StudentActivityStatus;
  submitted_at: Date;
  graded_at: Date;
  feedback: string | null;
  remark: string | null;
  student_score: Prisma.Decimal | null;
  is_bookmark: boolean;

  student_activity_rubric_score: {
    rubric_activity_mapping_id: number;
    rubric_level_id: number;
    calculated_score: Prisma.Decimal;
  }[];

  student: {
    first_name_th: string;
    last_name_th: string;
  };
};

export type GetStudentActivityDetailResp = GetActivityDetailResp &
  GetStudentActivityDetail & { submitted_files: AttachmentDetailResp };

//-------------------------------

export type GetAllSubmittedActivityByActivityIdResp = {
  activity_id: number;
  activity_name: string;
  deadline_date: Date | null;
  score: number | null;
  submissions: Submission[];
};

export type Submission = {
  id: number;
  submission_type: ClassworkType;
  status: StudentActivityStatusDB;
  submitted_at: Date | null;
  score: number | null;
  feedback: string | null;
  is_bookmark: boolean;

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

//----------------------------------

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

export type AddStudentActivityToBookmark = {
  activity_type: ClassworkType;
  student_activity_id: number;
  is_bookmark: boolean;
};

//-------------------------------

export type CalculateRubricScore = {
  tx: Prisma.TransactionClient;
  studentActivityIds: number[];
  rubric_detail: GradeStudentActivityData["rubric_detail"];
  full_score: number;
  total_level: number;
  feedback?: string | null;
  remark?: string | null;
};
