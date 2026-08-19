import { endpoints } from "../../../../configs/endpoints.config";
import { axiosInstance } from "../../../../lib/axios";
import type { ScoreWeightDetail } from "@deep-portfolio/api-types";
import type { Options, ResponseWrapper } from "../../../../types/global-type";
import type {
  AddScoreWeightBody,
  UpdateScoreWeightBody,
} from "../types/score-weight-type.type";

export const addScoreWeight = async (req: AddScoreWeightBody) => {
  // The new id itself. This said `{ score_weight_id: number }` until #68 — an
  // object where a number arrives. `score_weight_id` is a real key elsewhere:
  // the student's classwork list renames `score_ratio_id` to it. No endpoint
  // under /score-weight does, and this one sends no object at all.
  const resp = await axiosInstance.post<ResponseWrapper<number>>(
    endpoints["score_weight"].root,
    req,
  );

  return resp.data;
};

export const updateScoreWeight = async (body: UpdateScoreWeightBody) => {
  const resp = await axiosInstance.put<ResponseWrapper<ScoreWeightDetail>>(
    endpoints["score_weight"].root,
    body,
  );

  return resp.data;
};

export const deleteScoreWeight = async (scoreId: number) => {
  const resp = await axiosInstance.delete<ResponseWrapper<ScoreWeightDetail>>(
    endpoints["score_weight"].root,
    { params: { scoreId } },
  );

  return resp.data;
};

//------------------------------------------------------

export const getScoreWeightOptions = async (section_id: number) => {
  const resp = await axiosInstance.get<ResponseWrapper<Options[]>>(
    endpoints["score_weight"].options,
    { params: { section_id } },
  );

  return resp.data;
};
