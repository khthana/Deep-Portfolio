import { createAsyncThunk } from "@reduxjs/toolkit";
import type { ResponseWrapper } from "../../../../types/global-type";
import type {
  ActivityCLOMapping,
  CLOMappedActivity,
  CLOMappedLearningActivity,
  LearningActivityCLOMapping,
} from "@deep-portfolio/api-types";
import type {
  CreateActivityCLOMappingBodyReq,
  CreateLearningActivityCLOMappingBodyReq,
} from "../types/mapping-type.type";
import {
  createActivityCLOMapping,
  createLearningActivityCLOMapping,
  getActivity,
  getLearningActivity,
} from "../services/teacher-mapping.service";

export const postActivityCLOMapping = createAsyncThunk<
  ResponseWrapper<ActivityCLOMapping>,
  CreateActivityCLOMappingBodyReq
>("mapping/activity/add", createActivityCLOMapping);

export const fetchActivity = createAsyncThunk<
  ResponseWrapper<CLOMappedActivity[]>,
  number
>("mapping/activity", getActivity);

//-----------------------------------------------------------------

export const postLearningActivityCLOMapping = createAsyncThunk<
  ResponseWrapper<LearningActivityCLOMapping>,
  CreateLearningActivityCLOMappingBodyReq
>("mapping/learning-activity/add", createLearningActivityCLOMapping);

export const fetchLearningActivity = createAsyncThunk<
  ResponseWrapper<CLOMappedLearningActivity[]>,
  number
>("mapping/learning-activity", getLearningActivity);
