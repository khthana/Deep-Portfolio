import type { AttachmentDetailResp } from "../../../../types/attachment-type.type";

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

// export type CreateCourseMaterialReqBody = {
//   course_syllabus_id: number;
//   section_id: number;

//   urls: UploadURLDetail[];
//   files: Express.Multer.File[];
// };
