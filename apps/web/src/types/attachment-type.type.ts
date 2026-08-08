export type AttachmentDetailResp = {
  file: FileDetail[];
  url: URLDetail[];
};

export type FileDetail = {
  attachment_id: number;
  title: string;
  file_path: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  uploaded_at: Date | null;
};

export type URLDetail = {
  attachment_id: number;
  title: string;
  url: string;
  uploaded_at: Date | null;
};

export const AttachmentType = {
  FILE: "FILE",
  IMAGE: "IMAGE",
  LINK: "LINK",
} as const;

export type AttachmentType = keyof typeof AttachmentType;
