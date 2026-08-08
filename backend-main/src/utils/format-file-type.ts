import path from "path";

export const formatFileType = (filename: string) => {
  return path.extname(filename).replace(".", "").toUpperCase();
};
