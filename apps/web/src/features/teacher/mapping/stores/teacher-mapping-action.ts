import { createAsyncThunk } from "@reduxjs/toolkit";
import type { Options, ResponseWrapper } from "../../../../types/global-type";
import type {
  ActivityMappingDetailResp,
  CreateActivityCLOMappingBodyReq,
  CreateLearningActivityCLOMappingBodyReq,
  LearningActivityDetail,
} from "../types/mapping-type.type";
import {
  createActivityCLOMapping,
  createLearningActivityCLOMapping,
  getActivity,
  getLearningActivity,
} from "../services/teacher-mapping.service";

export const postActivityCLOMapping = createAsyncThunk<
  ResponseWrapper<{ id: number }>,
  CreateActivityCLOMappingBodyReq
>("mapping/activity/add", createActivityCLOMapping);

export const fetchActivity = createAsyncThunk<
  ResponseWrapper<ActivityMappingDetailResp[]>,
  number
>("mapping/activity", getActivity);

//-----------------------------------------------------------------

export const postLearningActivityCLOMapping = createAsyncThunk<
  ResponseWrapper<{ id: number }>,
  CreateLearningActivityCLOMappingBodyReq
>("mapping/learning-activity/add", createLearningActivityCLOMapping);

export const fetchLearningActivity = createAsyncThunk<
  ResponseWrapper<LearningActivityDetail[]>,
  number
>("mapping/learning-activity", getLearningActivity);
