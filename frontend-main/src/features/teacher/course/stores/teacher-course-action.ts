import { createAsyncThunk } from "@reduxjs/toolkit";

import type { Options, ResponseWrapper } from "../../../../types/global-type";
import {
  addScoreWeight,
  deleteScoreWeight,
  getScoreWeightOptions,
  updateScoreWeight,
} from "../services/score-weight-service.service";
import type {
  AddScoreWeightBody,
  UpdateScoreWeightBody,
} from "../types/score-weight-type.type";
import type { AddCLOBody, UpdateCLOBody } from "../types/clo-type.type";
import { addCLO, deleteCLO, updateCLO } from "../services/clo-service.service";
import type { CLOResp } from "../../../../types/course-type.type";
import {
  getCLO,
  getPLOList,
  getScoreWeight,
} from "../../../../services/course-service.service";
import type {
  PLOResp,
  ScoreWeightResp,
} from "../../../../types/course-type.type";
import type { CreateCourseSectionScheduleReq } from "../types/course-type.type";
import { createCourseSectionSchedule } from "../services/course-service.service";

export const fetchScoreWeight = createAsyncThunk<
  ResponseWrapper<ScoreWeightResp[]>,
  number
>("score-weight", getScoreWeight);

export const postScoreWeight = createAsyncThunk<
  ResponseWrapper<{ score_weight_id: number }>,
  AddScoreWeightBody
>("score-weight/add", addScoreWeight);

export const editScoreWeight = createAsyncThunk<
  ResponseWrapper<ScoreWeightResp>,
  UpdateScoreWeightBody
>("score-weight/update", updateScoreWeight);

export const removeScoreWeight = createAsyncThunk<
  ResponseWrapper<ScoreWeightResp>,
  number
>("score-weight/delete", deleteScoreWeight);

export const fetchScoreWeightOptions = createAsyncThunk<
  ResponseWrapper<Options[]>,
  number
>("score-weight/options", getScoreWeightOptions);

//----------------------------------------------------

export const fetchCLO = createAsyncThunk<ResponseWrapper<CLOResp[]>, number>(
  "teacher/clo",
  getCLO,
);

export const postCLO = createAsyncThunk<
  ResponseWrapper<{ id: number }>,
  AddCLOBody
>("clo/add", addCLO);

export const editCLO = createAsyncThunk<
  ResponseWrapper<{ clo_id: number }>,
  UpdateCLOBody
>("clo/update", updateCLO);

export const removeCLO = createAsyncThunk<
  ResponseWrapper<{ clo_id: number }>,
  number
>("clo/delete", deleteCLO);

//----------------------------------------------------

export const fetchPLO = createAsyncThunk<ResponseWrapper<PLOResp[]>, string>(
  "plo",
  getPLOList,
);

export const postCreateCourseSectionSchedule = createAsyncThunk<
  ResponseWrapper<any>,
  CreateCourseSectionScheduleReq
>("course-section-schedule/create", createCourseSectionSchedule);
