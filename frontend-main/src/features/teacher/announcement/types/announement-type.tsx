import type { JSONContent } from "@tiptap/react";
import type { UploadFile } from "antd";

export const AttachmentType = {
  FILE: "FILE",
  IMAGE: "IMAGE",
  LINK: "LINK",
} as const;

export type AttachmentType = keyof typeof AttachmentType;

export type AnnouncmentFormType = {
  title: string;
  detail: JSONContent;
  attachments: AttachmentDetailItem[];
};

export type LinkItems = {
  id?: number;
  title: string;
  url: string;
};

export type AttachmentDetailItem =
  | {
      attachmentType: "FILE";
      attachmentItems: UploadFile;
    }
  | {
      attachmentType: "IMAGE";
      attachmentItems: UploadFile;
    }
  | {
      attachmentType: "LINK";
      attachmentItems: LinkItems;
    };

//--------------------------------------
