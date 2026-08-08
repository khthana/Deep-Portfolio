import { endpoints } from "../../../../configs/endpoints.config";
import { axiosInstance } from "../../../../lib/axios";
import type { ScoreWeightResp } from "../../../../types/course-type.type";
import type { Options, ResponseWrapper } from "../../../../types/global-type";
import type {
  AddScoreWeightBody,
  UpdateScoreWeightBody,
} from "../types/score-weight-type.type";

export const addScoreWeight = async (req: AddScoreWeightBody) => {
  const resp = await axiosInstance.post<
    ResponseWrapper<{ score_weight_id: number }>
  >(endpoints["score_weight"].root, req);

  return resp.data;
};

export const updateScoreWeight = async (body: UpdateScoreWeightBody) => {
  const resp = await axiosInstance.put<ResponseWrapper<ScoreWeightResp>>(
    endpoints["score_weight"].root,
    body
  );

  return resp.data;
};

export const deleteScoreWeight = async (scoreId: number) => {
  const resp = await axiosInstance.delete<ResponseWrapper<ScoreWeightResp>>(
    endpoints["score_weight"].root,
    { params: { scoreId } }
  );

  return resp.data;
};

//------------------------------------------------------

export const getScoreWeightOptions = async (section_id: number) => {
  const resp = await axiosInstance.get<ResponseWrapper<Options[]>>(
    endpoints["score_weight"].options,
    { params: { section_id } }
  );

  return resp.data;
};
