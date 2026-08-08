import { endpoints } from "../configs/endpoints.config";
import { axiosInstance } from "../lib/axios";
import type { AnnouncementDetailResp } from "../types/course-type.type";
import type { ResponseWrapper } from "../types/global-type";

export const getAllAnnouncements = async (section_id: number) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<AnnouncementDetailResp[]>
  >(endpoints.announcement.root, {
    params: { section_id },
  });

  return resp.data;
};
