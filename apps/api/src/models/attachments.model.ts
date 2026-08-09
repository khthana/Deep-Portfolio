import type { UploadURLDetail } from "../validation/attachments.schema";

export type UploadAttachments = {
  urls: UploadURLDetail[];
  files: Express.Multer.File[];
};

export type { UploadURLDetail };
