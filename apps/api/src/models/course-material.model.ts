import { UploadURLDetail } from "./attachments.model";

// GetCourseMaterialDetailResp and CourseMaterialDetail used to be declared
// here. They moved to @deep-portfolio/api-types (#68) as `CourseMaterialWeek`
// and `CourseMaterialDetail` — the first was renamed because its old name said
// which endpoint fetched it rather than what it is (ADR-0035 §2), and because
// `title` on it is nullable, which the `as` in the service was covering. See
// ADR-0038.

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
