import type { ClassworkStatus } from "../features/student/course/types/course-type";
import type {
  AttachmentDetailResp,
  LearningActivityDetailResp,
} from "@deep-portfolio/api-types";

export type GetStudentLearningActivityDetail = {
  id: number;
  learning_activity_id: number;
  student_id: string;
  status: ClassworkStatus;
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

export type GetStudentLearningActivityDetailResp = LearningActivityDetailResp &
  GetStudentLearningActivityDetail & {
    submitted_files: AttachmentDetailResp;
  };
