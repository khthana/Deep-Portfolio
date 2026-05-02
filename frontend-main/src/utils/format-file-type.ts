export const formatFileType = (type: string) => {
  const fileType = type.split(".").pop();

  return fileType ? fileType.toUpperCase() : "";
};
