export type {
  CreateStudentLearningActivityGroupBody,
  UpdateStudentLearningActivityGroupBody,
} from "../validation/student-learning-activity-group.schema";

export type { MemberDetail } from "./student-activity-group.model";

// GetStudentLearningActivityGroupResp, MemberDetailResp and
// GetStudentsWithoutGroupResp used to be declared here — a second copy of what
// the file beside this one held. Both copies moved to
// @deep-portfolio/api-types as one set (#68); see ADR-0035.
