import type { MemberStatus } from "@deep-portfolio/api-types";

export type {
  CreateStudentActivityGroupBody,
  UpdateStudentActivityGroupBody,
  MemberDetail,
} from "../validation/student-activity-group.schema";

export type GroupRole = "LEADER" | "MEMBER";

// MemberStatus used to be declared here. It moved to @deep-portfolio/api-types
// (#68) because both roster endpoints send it inside SubmissionGroup — the rest
// of this feature has not moved. See ADR-0034.

export type GetStudentActivityGroupResp = {
  group_id: number;
  members: MemberDetailResp[];
};

export type MemberDetailResp = {
  student_id: string;
  role: GroupRole;
  student_name: string;
  status: MemberStatus;
};

export type GetStudentsWithoutGroupResp = {
  student_id: string;
  full_name_th: string;
};
