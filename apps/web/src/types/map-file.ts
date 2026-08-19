import type { UploadFile } from "antd/es/upload/interface";
import type { FileDetail } from "@deep-portfolio/api-types";

export const mapFileDetailToUploadFile = (file: FileDetail): UploadFile => {
  return {
    uid: file.attachment_id.toString(),
    name: file.original_filename,
    fileName: file.original_filename,
    size: file.file_size,
    type: `application/${file.file_type.toLowerCase()}`,
    url: file.file_path,
    status: "done",
  };
};
