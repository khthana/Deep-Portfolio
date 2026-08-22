import { Prisma } from "@prisma/client";
import type {
  AttachmentDetailResp,
  ClassworkStatus,
  ClassworkType,
} from "@deep-portfolio/api-types";

export type GetAllStudentLearningActivity = {
  attachments: AttachmentDetailResp;
  week_no: number | undefined;
  id: number;
  learning_activity_type: ClassworkType;
  learning_activity_name: string;
  deadline_date: Date | null;
  announcement_date: Date | null;
  /** `Int?` — a learning activity need not hang off a week of the plan. */
  course_syllabus_id: number | null;

  detail: Prisma.JsonValue;
  /** `Int`, not null, unlike `activities.section_id`. Both `as` casts said
   *  otherwise, and the mapper's `?? 0` is dead on this half (#68). */
  section_id: number;

  student_learning_activity: StudentLearningActivityBrief[];
};

type StudentLearningActivityBrief = {
  status: ClassworkStatus;
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
