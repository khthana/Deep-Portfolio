import { Prisma } from "@prisma/client";
import { AttachmentDetailResp } from "./announcement.model";
import { ClassworkType } from "./student.model";
import { GetActivityDetailResp } from "./activity.model";
import type { MemberStatus } from "./student-activity-group.model";
import type {
  BookmarkStudentActivityBody,
  GradeStudentActivityBody,
} from "../validation/student-activity.schema";

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
  "NOT_SUBMITTED" | "SUBMITTED" | "GRADED" | "LATE";

export type StudentActivityStatusDB =
  "NOT_SUBMITTED" | "SUBMITTED" | "GRADED" | "GRADING";

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
  // Decimal(5,2) in the database, converted to a number before it leaves the
  // service — the type says what is on the wire, not what Prisma returns (#33).
  student_score: number | null;
  is_bookmark: boolean;

  student_activity_rubric_score: {
    rubric_activity_mapping_id: number;
    rubric_level_id: number;
    calculated_score: number;
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

  group?: SubmissionGroup;
};

/**
 * The group behind a group submission, as a teacher's roster screen sees it.
 *
 * The two lists are deliberately separate. `members` means "who this score
 * lands on", which since ADR-0017 is the ACCEPT members and nobody else;
 * `unaccepted_members` is everyone who was invited and has not accepted, which
 * is information the teacher has no other way to get — invitations expire after
 * seven days and there is no resend endpoint, so a student who never clicked is
 * silently missing from the marking list (#53).
 */
export type SubmissionGroup = {
  group_id: number;
  members: GroupMemberDetail[];
  unaccepted_members: UnacceptedGroupMember[];
};

export type GroupMemberDetail = {
  student_id: string;
  first_name_th: string;
  last_name_th: string;
};

/** ACCEPT is what `members` is; what is left is the two kinds of silence, and
 *  the caller is told which one it is looking at. */
export type UnacceptedGroupMember = GroupMemberDetail & {
  status: Exclude<MemberStatus, "ACCEPT">;
};

//----------------------------------

export type GradeStudentActivityData = GradeStudentActivityBody;
export type AddStudentActivityToBookmark = BookmarkStudentActivityBody;

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
