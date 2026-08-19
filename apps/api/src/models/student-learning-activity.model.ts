import { Prisma } from "@prisma/client";
import type { AttachmentDetailResp } from "@deep-portfolio/api-types";
import { StudentActivityStatus } from "./student-activity.model";
import { ClassworkType } from "./student.model";

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

// GetStudentLearningActivityDetail, GetStudentLearningActivityDetailResp,
// GetAllSubmittedLearningActivityByLearningActivityIdResp and Submission used
// to be declared here. They moved to @deep-portfolio/api-types (#68) — import
// StudentLearningActivityDetailResp, LearningActivitySubmissionListResp and
// LearningActivitySubmission from there. Same corrections as the graded twin,
// minus every mention of a score. See ADR-0034.

export type {
  GradeStudentLearningActivityBody as GradeStudentLearningActivityData,
  BookmarkStudentLearningActivityBody as AddStudentLearningActivityToBookmark,
} from "../validation/student-learning-activity.schema";

//-------------------------------
