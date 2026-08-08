import type { JSONContent } from "@tiptap/react";
import type { RubricDetail } from "../../../../types/activity-type.type";
import type { AttachmentDetailResp } from "../../../../types/attachment-type.type";
import type { GetStudentActivityDetailResp } from "../../../../types/student-activity-type.type";
import type { GetStudentLearningActivityDetailResp } from "../../../../types/student-learning-activity-type.type";
import type { CourseMaterialDetail } from "../../../teacher/material/types/course-material-type";

export type CourseDetailSummary = {
  name: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  sec: number;
  teacher: string;
};

export type ClassworkDetail = {
  id: number;
  name: string;
  category: ClassworkCategory;
  type: ClassworkType;
  point: number | null;
  received_point: number | null;
  date: Date | null;
  status: ClassworkStatus;
  course: string;
  score_weight_id: number;
  subject_id: string;
  detail: JSON;
  section_id: number;
  deadline_date: Date;
};

export type ClassworkDetailResp = {
  today: ClassworkDetail[];
  other: { title: string; classworks: ClassworkDetail[] }[];
};

export type ClassworkCategory = "activity" | "learning_activity";

export const classworkCategoryLabel: Record<ClassworkCategory, string> = {
  activity: "กิจกรรมการประเมิน",
  learning_activity: "กิจกรรมการเรียนรู้",
};

export const ClassworkType = {
  INDIVIDUAL: "INDIVIDUAL",
  GROUP: "GROUP",
} as const;

export const classworkTypeLabel: Record<ClassworkType, string> = {
  INDIVIDUAL: "งานเดี่ยว",
  GROUP: "งานกลุ่ม",
};

export const ClassworkStatus = {
  NOT_SUBMITTED: "NOT_SUBMITTED",
  SUBMITTED: "SUBMITTED",
  GRADED: "GRADED",
  LATE: "LATE",
} as const;

export const classworkStatusLabel: Record<ClassworkStatus, string> = {
  NOT_SUBMITTED: "ยังไม่ส่ง",
  SUBMITTED: "ส่งแล้ว",
  GRADED: "ให้คะแนนแล้ว",
  LATE: "ยังไม่ส่ง",
};

export const classworkTypeBGColor: Record<ClassworkType, string> = {
  INDIVIDUAL: "rgb(48,104,217,0.15)", // ฟ้า
  GROUP: "rgb(59,139,92,0.15)", // เขียว
};

export const classworkTypeTextColor: Record<ClassworkType, string> = {
  INDIVIDUAL: "#172C94", // ฟ้า
  GROUP: "#3B8B5C", // เขียว
};

export const classworkStatusIcon: Record<ClassworkStatus, string> = {
  NOT_SUBMITTED: "/assets/course/not-submitted-icon.svg",
  SUBMITTED: "/assets/course/submitted-icon.svg",
  GRADED: "/assets/course/graded-icon.svg",
  LATE: "/assets/course/late-icon.svg",
};

export const learningActivityStatusIcon: Record<ClassworkStatus, string> = {
  NOT_SUBMITTED: "/assets/course/not-submitted-green-icon.svg",
  SUBMITTED: "/assets/course/submitted-icon.svg",
  GRADED: "/assets/course/graded-icon.svg",
  LATE: "/assets/course/late-icon.svg",
};

export const classworkStatusColor: Record<ClassworkStatus, string> = {
  NOT_SUBMITTED: "#3068D9", // ฟ้า
  SUBMITTED: "#7C7C7C", // ดำ
  GRADED: "#2C3142", // ดำ
  LATE: "#E02929", // แดง
};

export const learningActivityStatusColor: Record<ClassworkStatus, string> = {
  NOT_SUBMITTED: "#3B8B5C", // ฟ้า
  SUBMITTED: "#7C7C7C", // ดำ
  GRADED: "#2C3142", // ดำ
  LATE: "#E02929", // แดง
};

export type ClassworkStatus = keyof typeof ClassworkStatus;
export type ClassworkType = keyof typeof ClassworkType;

// todo: change boolean to File
export type AnnouncementDetail = {
  title: string;
  detail: string;
  dateTime: string;
  file?: boolean;
};

//--------------------------

export type GetStudentCourseListParams = {
  student_id: string;
  semester: string;
  academic_year: string;
};

export type GetStudentClassworkListParams = {
  student_id: string;
  section_id: number;
};

//---------------------------------------

export type ClassworkDetailFull = {
  id: number;
  name: string;
  type: "INDIVIDUAL" | "GROUP";
  score: number | null;
  student_score: number | null;
  deadline_date: Date | null;
  detail: JSONContent | null;
  attachments: AttachmentDetailResp | null;
  rubrics: RubricDetail[] | null;
  expected_level: number | null;
  status: ClassworkStatus;
  category: "activity" | "learning_activity";

  student_id: string;
  section_id: number;
  activity_id: number;

  submitted_files: AttachmentDetailResp;
  submitted_at: Date;
};

//------------------------------------

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

export const memberStatus = {
  PENDING: "PENDING",
  ACCEPT: "ACCEPT",
  REJECTED: "REJECTED",
} as const;

export const memberStatusLabel: Record<MemberStatus, string> = {
  PENDING: "รออนุมัติ",
  ACCEPT: "อนุมัติ",
  REJECTED: "ปฏิเสธ",
};

export const memberStatusBGColor: Record<MemberStatus, string> = {
  PENDING: "rgb(241,188,65,0.2)",
  ACCEPT: "rgb(59,139,92,0.2)",
  REJECTED: "rgb(224,41,41,0.2)",
};

export const memberStatusTextColor: Record<MemberStatus, string> = {
  PENDING: "#C39939",
  ACCEPT: "#3B8B5C",
  REJECTED: "#E02929",
};

export type MemberStatus = keyof typeof memberStatus;

export type GetStudentActivityGroupParams = {
  activity_id: number;
  student_id: string;
};

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

export type GetStudentActivityGroupInSecParams = {
  section_id: number;
  student_id: string;
};

export type GetStudentWithoutGroupParams = {
  section_id: number;
  activity_id: number;
};

export type GetStudentWithoutGroupResp = {
  student_id: string;
  full_name_th: string;
};
//-----------------------------------

export type CreateStudentLearningActivityGroupBody = {
  learning_activity_id: number;
  members: MemberDetail[];
};

export type UpdateStudentLearningActivityGroupBody = {
  group_id: number;
  members: MemberDetail[];
};

export type GetStudentsWithoutGroupResp = {
  student_id: string;
  full_name_th: string;
};

export type GetStudentLearningActivityGroupParams = {
  learning_activity_id: number;
  student_id: string;
};

export type GetStudentLearningActivityWithoutGroupParams = {
  section_id: number;
  learning_activity_id: number;
};

//------------------------------------

export type GetStudentEvaluationListParams = {
  student_id: string;
  section_id: number;
};

export type GetStudentEvaluationListResp = {
  evaluations: StudentEvaluationData[];
};

export type StudentEvaluationData = {
  id: number;
  activity_id: number;
  activity_name: string;
  deadline_date: Date | null;
  full_score: number | null;
  max_score: number | null;
  mean_score: number | null;
  min_score: number | null;
  submitted_count: number | null;
  not_submitted_count: number | null;
  graded_count: number | null;

  score: number | null;
  status: string;
  type: ClassworkCategory;
};

//------------------------------------

export type GetStudentLessonPlanWithMaterialResp = {
  allActivities: string[];
  course_materials: CourseMaterialDetail | null;
  week_no: number;
  description: string | null;
  remark: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  title: string | null;
  created_by: string | null;
  section_id: number | null;
  id: number;
};

//------------------------------------

export const mapActivityDetail = (
  data: GetStudentActivityDetailResp,
): ClassworkDetailFull => ({
  id: data.id,
  name: data.activity_name,
  type: data.activity_type,
  score: data.score_number,
  deadline_date: data.deadline_date,
  detail: data.detail,
  attachments: data.attachments,
  rubrics: data.rubric_activity_mapping,
  expected_level: data.expected_level ?? null,
  status: data.status,
  section_id: data.section_id ?? 0,
  student_id: data.student_id,
  activity_id: data.activity_id,
  category: "activity",
  student_score: data.student_score,

  submitted_files: data.submitted_files,
  submitted_at: data.submitted_at,
});

export const mapLearningActivityDetail = (
  data: GetStudentLearningActivityDetailResp,
): ClassworkDetailFull => ({
  id: data.id,
  name: data.learning_activity_name,
  type: data.learning_activity_type,
  score: null,
  deadline_date: data.deadline_date,
  detail: data.detail,
  attachments: data.attachments,
  rubrics: null,
  expected_level: null,
  status: data.status,
  student_score: null,

  section_id: data.section_id ?? 0,
  student_id: data.student_id,
  activity_id: data.learning_activity_id,
  category: "learning_activity",

  submitted_files: data.submitted_files,
  submitted_at: data.submitted_at,
});
