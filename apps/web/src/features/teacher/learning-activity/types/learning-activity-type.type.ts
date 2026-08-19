import type { JSONContent } from "@tiptap/react";
import type { AttachmentDetailItem } from "../../announcement/types/announement-type";
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

// GetAllLearningActivityList used to be declared here. It moved to
// @deep-portfolio/api-types (#68) as LearningActivityListItem — the endpoint
// answers a list and this is one row of it, which the old name did not say.
// section_id and the three counts are never null, the dates are strings, and
// two columns it had never declared — learning_activity_type and
// course_syllabus_id — are written down. See ADR-0033.

// GetAllSubmittedLearningActivityByLearningActivityIdResp and Submission used
// to be declared here. They moved to @deep-portfolio/api-types (#68) — import
// LearningActivitySubmissionListResp and LearningActivitySubmission from there.
// Same union as the graded twin, minus the score. See ADR-0034.

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
