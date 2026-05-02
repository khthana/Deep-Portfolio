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
import type { LessonPlanResp } from "../../../../types/course-type.type";
import { getLessonPlan } from "../../../../services/course-service.service";

export const fetchLessonPlan = createAsyncThunk<
  ResponseWrapper<LessonPlanResp[]>,
  number
>("lesson-plan", getLessonPlan);

export const postLessonPlan = createAsyncThunk<
  ResponseWrapper<{ lesson_plan_id: number }>,
  AddLessonPlanBody
>("lesson-plan/add", addLessonPlan);

export const editLessonPlan = createAsyncThunk<
  ResponseWrapper<LessonPlanResp>,
  UpdateLessonPlanBody
>("lesson-plan/update", updateLessonPlan);

export const removeLessonPlan = createAsyncThunk<
  ResponseWrapper<{ lesson_plan_id: number }>,
  number
>("lesson-plan/delete", deleteLessonPlan);

//-----------------------------------------------------

export const fetchLessonPlanOptions = createAsyncThunk<
  ResponseWrapper<Options[]>,
  number
>("lesson-plan/options", getLessonPlanOptions);
