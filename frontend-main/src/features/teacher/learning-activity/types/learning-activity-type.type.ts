import type { JSONContent } from "@tiptap/react";
import type { AttachmentDetailItem } from "../../announcement/types/announement-type";
import type { StudentActivityStatusDB } from "../../../../types/activity-type.type";
import type { ClassworkType } from "../../../student/course/types/course-type";

export type CreateLearningActivityFormType = {
  announcement_date: Date;
  deadline_date: Date;
  course_syllabus_id: number;
  learning_activity_name: string;
  learning_activity_type: string;
  detail: JSONContent;

  attachments: AttachmentDetailItem[];
};

export type CreateLearningActivityReqBody = {
  announcement_date: Date;
  deadline_date: Date;
  course_syllabus_id: number;
  learning_activity_name: string;
  learning_activity_type: string;
  detail: JSONContent;
  section_id: number;
};

//----------------------------------------------

export type GetAllLearningActivityList = {
  id: number;
  learning_activity_name: string;
  announcement_date: Date | null;
  deadline_date: Date | null;
  section_id: number | null;
  week_no: number | undefined;

  submitted_count: number | null;
  pending_grading_count: number | null;
  student_count: number | null;
};

export type GetAllSubmittedLearningActivityByLearningActivityIdResp = {
  learning_activity_id: number;
  learning_activity_name: string;
  deadline_date: Date | null;
  submissions: Submission[];
};

export type Submission = {
  id: number;
  submission_type: ClassworkType;
  status: StudentActivityStatusDB;
  submitted_at: Date | null;
  feedback: string | null;
  is_bookmark: boolean;
  remark: string | null;

  student?: {
    student_id: string;
    first_name_th: string;
    last_name_th: string;
  };

  group?: {
    group_id: number;
    members: {
      student_id: string;
      first_name_th: string;
      last_name_th: string;
    }[];
  };
};

//-----------------------------

export type GradingFormType = {
  feedback: string;
  remark: string;
};

export type GradeStudentLearningActivityData = {
  activity_type: ClassworkType;
  student_learning_activity_id: number;
  feedback: string;
  remark: string;
};

export type AddStudentLearningActivityToBookmark = {
  activity_type: ClassworkType;
  student_learning_activity_id: number;
  is_bookmark: boolean;
};
