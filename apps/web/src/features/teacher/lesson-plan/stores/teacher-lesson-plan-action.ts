import { createAsyncThunk } from "@reduxjs/toolkit";
import type { Options, ResponseWrapper } from "../../../../types/global-type";
import {
  addLessonPlan,
  updateLessonPlan,
  deleteLessonPlan,
  getLessonPlanOptions,
} from "../services/lesson-plan-service.service";
import type {
  AddLessonPlanBody,
  UpdateLessonPlanBody,
} from "../types/lesson-plan-type.type";
import type {
  LessonPlanIdResp,
  LessonPlanRow,
  LessonPlanWeek,
} from "@deep-portfolio/api-types";
import { getLessonPlan } from "../../../../services/course-service.service";

export const fetchLessonPlan = createAsyncThunk<
  ResponseWrapper<LessonPlanWeek[]>,
  number
>("lesson-plan", getLessonPlan);

export const postLessonPlan = createAsyncThunk<
  ResponseWrapper<LessonPlanIdResp>,
  AddLessonPlanBody
>("lesson-plan/add", addLessonPlan);

export const editLessonPlan = createAsyncThunk<
  ResponseWrapper<LessonPlanRow>,
  UpdateLessonPlanBody
>("lesson-plan/update", updateLessonPlan);

export const removeLessonPlan = createAsyncThunk<
  ResponseWrapper<LessonPlanIdResp>,
  number
>("lesson-plan/delete", deleteLessonPlan);

//-----------------------------------------------------

export const fetchLessonPlanOptions = createAsyncThunk<
  ResponseWrapper<Options[]>,
  number
>("lesson-plan/options", getLessonPlanOptions);
