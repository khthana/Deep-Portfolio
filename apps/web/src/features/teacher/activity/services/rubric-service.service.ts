import { endpoints } from "../../../../configs/endpoints.config";
import { axiosInstance } from "../../../../lib/axios";
import type { ResponseWrapper } from "../../../../types/global-type";
import type {
  SharedRubricDetailResp,
  SharedRubricResp,
} from "../types/rubric-type.type";

export const getSharedRubric = async (program_id: string) => {
  const resp = await axiosInstance.get<ResponseWrapper<SharedRubricResp[]>>(
    endpoints.rubric["shared-rubric"],
    { params: { program_id } }
  );

  return resp.data;
};

export const getSharedRubricDetail = async (rubric_id: number) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<SharedRubricDetailResp[]>
  >(endpoints.rubric["shared-rubric-detail"], { params: { rubric_id } });

  return resp.data;
};
