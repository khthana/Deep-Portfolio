import {
  AttachmentType,
  type AttachmentDetailItem,
} from "../features/teacher/announcement/types/announement-type";

import dayjs from "dayjs";

export const appendPrimitive = (
  formData: FormData,
  key: string,
  value: unknown
) => {
  if (value === null || value === undefined) return;

  if (dayjs.isDayjs(value)) {
    formData.append(key, value.toISOString());
    return;
  }

  if (typeof value === "object" || key === "detail") {
    formData.append(key, JSON.stringify(value));
    return;
  }

  formData.append(key, String(value));
};

//--------------------------------------

export const appendAttachments = (
  formData: FormData,
  attachments: AttachmentDetailItem[]
) => {
  if (!attachments?.length) return;

  const links = attachments
    .filter((a) => a.attachmentType === AttachmentType.LINK)
    .map((a) => ({
      title: a.attachmentItems.title,
      url: a.attachmentItems.url,
    }));

  if (links.length > 0) {
    formData.append("urls", JSON.stringify(links));
  }

  attachments
    .filter(
      (a) =>
        a.attachmentType === AttachmentType.FILE ||
        a.attachmentType === AttachmentType.IMAGE
    )
    .forEach((a) => {
      formData.append("files", a.attachmentItems.originFileObj as File);
    });
};
