export type CreateStudentActivityGroupBody = {
  activity_id: number;
  members: MemberDetail[];
};

export type UpdateStudentActivityGroupBody = {
  group_id: number;
  members: MemberDetail[];
};

export type MemberDetail = {
  student_id: string;
  role: GroupRole;
};

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
