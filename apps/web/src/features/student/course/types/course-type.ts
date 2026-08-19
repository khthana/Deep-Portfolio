import type { JSONContent } from "@tiptap/react";
import type {
  AttachmentDetailResp,
  CourseMaterialDetail,
  GroupRole,
  RubricDetail,
  StudentActivityDetailResp,
  StudentActivityStatusDB,
  StudentLearningActivityDetailResp,
} from "@deep-portfolio/api-types";

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
  // A string: both halves that fill this now come off @deep-portfolio/api-types
  // (#68), and a date over JSON is a string. It was briefly `Date | string`
  // while only the activity half had moved.
  deadline_date: string | null;
  detail: JSONContent | null;
  attachments: AttachmentDetailResp | null;
  rubrics: RubricDetail[] | null;
  expected_level: number | null;
  // The column, not the reading of it. `ClassworkStatus` here used to say
  // `LATE`, which neither endpoint filling this has ever sent — it is
  // getDisplayStatus() comparing a deadline to the clock, and it reaches a
  // screen only through the student's classwork list. What these two do send is
  // `GRADING`, which the old union had no room for at all (#68).
  status: StudentActivityStatusDB;
  category: "activity" | "learning_activity";

  student_id: string;
  section_id: number;
  activity_id: number;

  submitted_files: AttachmentDetailResp;
  submitted_at: string | null;
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

/** Inviting one member again (#57). The same two fields on both kinds of group,
 *  which is why one type serves both thunks. */
export type ResendInviteBody = {
  group_id: number;
  student_id: string;
};

// GroupRole used to be declared here. It moved to @deep-portfolio/api-types
// (#68) along with the rest of the group's response shapes; see ADR-0035.

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

// The group reads are about the student who is signed in, so they no longer
// name one — the API takes it from the session (#26).
export type GetStudentActivityGroupParams = {
  activity_id: number;
};

// GetStudentActivityGroupResp and MemberDetailResp used to be declared here.
// They moved to @deep-portfolio/api-types (#68) — import GroupDetailResp and
// GroupMemberDetail from there. This file only ever held one copy, and the
// learning-activity half read it too: the two group tables are mirror images,
// so one declaration always served both. The API had a second copy, and that
// is the one the move collapsed. See ADR-0035.

export type GetStudentActivityGroupInSecParams = {
  section_id: number;
};

export type GetStudentWithoutGroupParams = {
  section_id: number;
  activity_id: number;
};

// GetStudentWithoutGroupResp used to be declared here — twice, once for each
// half, with the same two fields. It moved to @deep-portfolio/api-types as
// StudentWithoutGroup (#68), and its `full_name_th` says `string | null` there,
// which is what the column is and what the endpoint sends untouched.

//-----------------------------------

export type CreateStudentLearningActivityGroupBody = {
  learning_activity_id: number;
  members: MemberDetail[];
};

export type UpdateStudentLearningActivityGroupBody = {
  group_id: number;
  members: MemberDetail[];
};

export type GetStudentLearningActivityGroupParams = {
  learning_activity_id: number;
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

// The response itself moved to @deep-portfolio/api-types (#68) — import
// `StudentEvaluationListResp` from there. It is a union discriminated on
// `type` now, because the two kinds of row are not the same shape and the
// optional fields this file used to carry described a superset of what the
// endpoint sends (ADR-0030).

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
  data: StudentActivityDetailResp,
): ClassworkDetailFull => ({
  id: data.id,
  name: data.activity_name,
  type: data.activity_type,
  score: data.score_number,
  deadline_date: data.deadline_date,
  // The API does not know what is in this column and says so — `unknown` off
  // the wire (#68). The editor at this end is the only thing that ever wrote
  // it, so this is the one place that says what it is.
  detail: data.detail as JSONContent | null,
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
  data: StudentLearningActivityDetailResp,
): ClassworkDetailFull => ({
  id: data.id,
  name: data.learning_activity_name,
  type: data.learning_activity_type,
  score: null,
  deadline_date: data.deadline_date,
  // Same reason as the activity half above.
  detail: data.detail as JSONContent | null,
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
