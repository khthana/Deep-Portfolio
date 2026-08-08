import type { ClassworkStatus } from "../features/student/course/types/course-type";
import type { GetLearningActivityDetailResp } from "./activity-type.type";
import type { AttachmentDetailResp } from "./attachment-type.type";

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

export type GetStudentLearningActivityDetailResp =
  GetLearningActivityDetailResp &
    GetStudentLearningActivityDetail & {
      submitted_files: AttachmentDetailResp;
    };
