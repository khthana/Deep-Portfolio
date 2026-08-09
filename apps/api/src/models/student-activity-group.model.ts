export type {
  CreateStudentActivityGroupBody,
  UpdateStudentActivityGroupBody,
  MemberDetail,
} from "../validation/student-activity-group.schema";

export type GroupRole = "LEADER" | "MEMBER";
export type MemberStatus = "PENDING" | "ACCEPT" | "REJECTED";

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
