import { Prisma } from "@prisma/client";
import type {
  AttachmentDetailResp,
  ClassworkStatus,
  ClassworkType,
} from "@deep-portfolio/api-types";

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
  status: ClassworkStatus;
  id: number;
  received_point: number | null;
};

// StudentActivityStatus used to be declared here, as the column's four values
// with LATE in place of GRADING. Both halves of that were wrong: getDisplayStatus
// substitutes LATE for NOT_SUBMITTED and passes every other value through
// untouched, GRADING included. The union that says so is ClassworkStatus in
// @deep-portfolio/api-types (#68) — see ADR-0045.

//-----------------------------------

// GetStudentActivityDetail, GetStudentActivityDetailResp,
// GetAllSubmittedActivityByActivityIdResp, Submission, SubmissionGroup,
// GroupMemberDetail and UnacceptedGroupMember used to be declared here. They
// moved to @deep-portfolio/api-types (#68) — import StudentActivityDetailResp,
// ActivitySubmissionListResp and ActivitySubmission from there, and the group
// shapes from group.ts, which is where they belong now that both rosters send
// them. The row is a union on submission_type rather than one row with both
// halves optional, `remark` was on the wire and undeclared, and every date says
// string. See ADR-0034.

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
