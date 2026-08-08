import { endpoints } from "../../../../configs/endpoints.config";
import { axiosInstance } from "../../../../lib/axios";
import type { ResponseWrapper } from "../../../../types/global-type";
import type { AddCLOBody, UpdateCLOBody } from "../types/clo-type.type";

export const addCLO = async (req: AddCLOBody) => {
  const resp = await axiosInstance.post<ResponseWrapper<{ id: number }>>(
    endpoints.course.clo,
    req
  );

  return resp.data;
};

export const updateCLO = async (req: UpdateCLOBody) => {
  const resp = await axiosInstance.put<ResponseWrapper<{ clo_id: number }>>(
    endpoints.course.clo,
    req
  );

  return resp.data;
};

export const deleteCLO = async (clo_id: number) => {
  const resp = await axiosInstance.delete<ResponseWrapper<{ clo_id: number }>>(
    endpoints.course.clo,
    { params: { clo_id } }
  );

  return resp.data;
};
