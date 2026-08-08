import { endpoints } from "../../../../configs/endpoints.config";
import { axiosInstance } from "../../../../lib/axios";
import type { ResponseWrapper } from "../../../../types/global-type";

export const createAnnouncement = async (formData: FormData) => {
  const resp = await axiosInstance.post<
    ResponseWrapper<{ announcement_id: number }>
  >(endpoints.announcement.root, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return resp.data;
};
