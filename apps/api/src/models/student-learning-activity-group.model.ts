import type { MemberStatus } from "@deep-portfolio/api-types";
import { GroupRole } from "./student-activity-group.model";

export type {
  CreateStudentLearningActivityGroupBody,
  UpdateStudentLearningActivityGroupBody,
} from "../validation/student-learning-activity-group.schema";

export type { MemberDetail } from "./student-activity-group.model";

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
