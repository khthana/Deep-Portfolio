import { AttachmentDetailResp } from "./announcement.model";
import { UploadURLDetail } from "./attachments.model";

export type GetCourseMaterialDetailResp = {
  course_syllabus_id: number;
  week_no: number;
  title: string;
  course_materials: CourseMaterialDetail;
};

export type CourseMaterialDetail = {
  lecture: AttachmentDetailResp;
  record: AttachmentDetailResp;
};

//------------------------------------

export type CreateCourseMaterialReqBody = {
  course_syllabus_id: number;
  section_id: number;

  lecture: {
    urls: UploadURLDetail[];
    files: Express.Multer.File[];
  };
  record: {
    urls: UploadURLDetail[];
    files: Express.Multer.File[];
  };
};
