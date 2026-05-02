export type UploadAttachments = {
  urls: UploadURLDetail[];
  files: Express.Multer.File[];
};

export type UploadURLDetail = {
  title: string;
  url: string;
};
