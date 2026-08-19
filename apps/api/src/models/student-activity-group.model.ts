export type {
  CreateStudentActivityGroupBody,
  UpdateStudentActivityGroupBody,
  MemberDetail,
} from "../validation/student-activity-group.schema";

// GroupRole, MemberStatus, GetStudentActivityGroupResp, MemberDetailResp and
// GetStudentsWithoutGroupResp used to be declared here. They moved to
// @deep-portfolio/api-types (#68) — import GroupRole, MemberStatus,
// GroupDetailResp, GroupMemberDetail and StudentWithoutGroup from there. One
// declaration of each now serves both group features, because the two tables
// are mirror images and their endpoints answer the same shape field for field;
// and `full_name_th` on the without-group row says `string | null`, which is
// what the column is and what this endpoint hands over untouched. See ADR-0035.
