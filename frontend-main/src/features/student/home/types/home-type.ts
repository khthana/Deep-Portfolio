import type { ClassworkDetail } from "../../course/types/course-type";

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

export type AllClassworkDetailResp = {
  late: ClassworkDetail[];
  this_week: ClassworkDetail[];
  upcoming: ClassworkDetail[];
  submitted: ClassworkDetail[];
};

//---------------------------------------------

export type StudentDetail = {
  user_id: string;
  student_id: string;
  full_name_th: string | null;
  //   full_name_en: string;
  first_name_th: string;
  last_name_th: string;

  title_th: string | null;
  email: string | null;
  phone: string | null;
  department_name: string;
  program_name: string;
};
