import type { GetActivityDetailResp } from "./activity-type.type";
import type { AttachmentDetailResp } from "./attachment-type.type";
import type { ClassworkStatus } from "../features/student/course/types/course-type";

export type GetStudentActivityDetail = {
  id: number;
  activity_id: number;
  student_id: string;
  status: ClassworkStatus;
  submitted_at: Date;
  graded_at: Date;
  feedback: string | null;
  remark: string | null;
  student_score: number | null;
  is_bookmark: boolean;

  student_activity_rubric_score: {
    rubric_level_id: number;
    calculated_score: number;
    rubric_activity_mapping_id: number;
  }[];

  student: {
    first_name_th: string;
    last_name_th: string;
  };
};

export type GetStudentActivityDetailResp = GetActivityDetailResp &
  GetStudentActivityDetail & { submitted_files: AttachmentDetailResp };
