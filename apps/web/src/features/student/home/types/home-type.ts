export const AssignmentGroupType = {
  LATE: "LATE",
  THIS_WEEK: "THIS_WEEK",
  UPCOMING: "UPCOMING",
  SUBMITTED: "SUBMITTED",
};

export const AssignmentDueType = {
  LATE: "LATE",
  TODAY: "TODAY",
  TOMORROW: "TOMORROW",
  UPCOMING: "UPCOMING",
  SUBMITTED: "SUBMITTED",
};

export const assignmentGroupLabel: Record<AssignmentGroupType, string> = {
  [AssignmentGroupType.LATE]: "เลยกำหนด",
  [AssignmentGroupType.THIS_WEEK]: "ส่งสัปดาห์นี้",
  [AssignmentGroupType.UPCOMING]: "ส่งภายหลัง",
  [AssignmentGroupType.SUBMITTED]: "ส่งแล้ว",
};

export const assignmentDueColor: Record<AssignmentDueType, string> = {
  [AssignmentDueType.LATE]: "#E02929",
  [AssignmentDueType.TODAY]: "#F4632A",
  [AssignmentDueType.TOMORROW]: "#F1BC41",
  [AssignmentDueType.UPCOMING]: "#FFFFFF",
  [AssignmentDueType.SUBMITTED]: "#FFFFFF",
};

export type AssignmentGroupType =
  (typeof AssignmentGroupType)[keyof typeof AssignmentGroupType];

export type AssignmentDueType =
  (typeof AssignmentDueType)[keyof typeof AssignmentDueType];

//--------------------------------------------------------

export type GetStudentAllCLassworkListParams = {
  student_id: string;
  semester: string;
  academic_year: string;
};

// AllClassworkDetailResp and StudentDetail used to be declared here. Both moved
// to @deep-portfolio/api-types (#68) — import them from there. StudentDetail
// went a pass earlier, with the aggregate portfolio read that embeds it
// (ADR-0043 §3), and this file kept a second copy that said four of its ten
// fields were nullable; the service coalesces every one of them to "", so a
// caller sees an empty string and never a null. See ADR-0045.
