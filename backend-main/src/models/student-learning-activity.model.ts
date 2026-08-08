import { Prisma } from "@prisma/client";
import { AttachmentDetailResp } from "./announcement.model";
import {
  StudentActivityStatus,
  StudentActivityStatusDB,
} from "./student-activity.model";
import { ClassworkType } from "./student.model";
import { GetLearningActivityDetailResp } from "./learning-activity.model";

export type GetAllStudentLearningActivity = {
  attachments: AttachmentDetailResp;
  week_no: number | undefined;
  id: number;
  learning_activity_type: ClassworkType;
  learning_activity_name: string;
  deadline_date: Date | null;
  announcement_date: Date | null;
  course_syllabus_id: number;

  detail: Prisma.JsonValue;
  section_id: number | null;

  student_learning_activity: StudentLearningActivityBrief[];
};

type StudentLearningActivityBrief = {
  status: StudentActivityStatus;
  id: number;
};

//-----------------------------------

export type GetStudentLearningActivityDetail = {
  id: number;
  learning_activity_id: number;
  student_id: string;
  status: StudentActivityStatus;
  submitted_at: Date;
  graded_at: Date;
  feedback: string | null;
  is_bookmark: boolean;
  remark: string | null;

  student: {
    first_name_th: string;
    last_name_th: string;
  };
};

export type GetStudentLearningActivityDetailResp =
  GetLearningActivityDetailResp &
    GetStudentLearningActivityDetail & {
      submitted_files: AttachmentDetailResp;
    };

//--------------------------------

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

//-------------------------------

export type GradeStudentLearningActivityData = {
  activity_type: ClassworkType;
  student_learning_activity_id: number;
  feedback: string;
  remark: string;
};

export type AddStudentLearningActivityToBookmark = {
  student_learning_activity_id: number;
  is_bookmark: boolean;
};

//-------------------------------
