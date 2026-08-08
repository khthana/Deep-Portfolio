import { Prisma, student_activity_status } from "@prisma/client";
import { Weekday } from "./course.model";
import { UploadURLDetail } from "./attachments.model";

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
  score_weight_id: number | null;
  subject_id: string;
  detail: Prisma.JsonValue;
  section_id: number;
  deadline_date: Date | null;
  announcement_date: Date | null;
};

export type ClassworkCategory = "activity" | "learning_activity";

export type ClassworkDetailResp = {
  today: ClassworkDetail[];
  other: { title: string; classworks: ClassworkDetail[] }[];
};

export type AllClassworkDetailResp = {
  late: ClassworkDetail[];
  this_week: ClassworkDetail[];
  upcoming: ClassworkDetail[];
  submitted: ClassworkDetail[];
};

export const ClassworkType = {
  INDIVIDUAL: "INDIVIDUAL",
  GROUP: "GROUP",
} as const;

export const ClassworkStatus = {
  NOT_SUBMITTED: "NOT_SUBMITTED",
  SUBMITTED: "SUBMITTED",
  GRADED: "GRADED",
  LATE: "LATE",
} as const;

export type ClassworkStatus = keyof typeof ClassworkStatus;
export type ClassworkType = keyof typeof ClassworkType;

//---------------------------------------------------

export type SubmitActivityBody = {
  student_activity_id: number;
  section_id: number;
  activity_id: number;
  student_id: string;
  type: ClassworkType;

  group_id?: number;
  files: Express.Multer.File[];
  urls: UploadURLDetail[];
  existing_files_ids: number[];
};

export type SubmitLearningActivityBody = {
  student_learning_activity_id: number;
  section_id: number;
  learning_activity_id: number;
  student_id: string;
  type: ClassworkType;

  group_id?: number;
  files: Express.Multer.File[];
  urls: UploadURLDetail[];
  existing_files_ids: number[];
};

//---------------------------------------------------

export type CalendarEventResp = {
  activities: CalendarClassworkEvent[];
  learning_activities: CalendarClassworkEvent[];
  courses: CalendarCourseEvent[];
};

/**
 * What the service builds, not what the caller reads: `res.json` turns the
 * Date into an ISO string and drops `course` when it is undefined, so the
 * response body has a string date and may have no `course` key at all.
 *
 * Every widened field below was a lie the old `as` cast was hiding. `type` is
 * a VarChar with no enum behind it; the course name comes from a `find` that
 * can miss; and the status is whatever the column holds, which includes
 * GRADING — a value ClassworkStatus does not have, because that union is the
 * *classwork list's* vocabulary and carries a computed LATE the database has
 * never heard of.
 */
export type CalendarClassworkEvent = {
  id: number;
  name: string;
  deadline_date: Date | null;
  type: string;
  status: student_activity_status;
  course: string | undefined;
};

export type CalendarCourseEvent = {
  id: number;
  name: string;
  // start_date: Date;
  // end_date: Date;
  day_of_week: Weekday | null;
  start_time: string | null;
  end_time: string | null;
  classroom: string | null;
};
