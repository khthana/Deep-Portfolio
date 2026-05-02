import { GroupRole, MemberStatus } from "./student-activity-group.model";

export type CreateStudentLearningActivityGroupBody = {
  learning_activity_id: number;
  members: MemberDetail[];
};

export type UpdateStudentLearningActivityGroupBody = {
  group_id: number;
  members: MemberDetail[];
};

export type MemberDetail = {
  student_id: string;
  role: GroupRole;
};

export type GetStudentLearningActivityGroupResp = {
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
