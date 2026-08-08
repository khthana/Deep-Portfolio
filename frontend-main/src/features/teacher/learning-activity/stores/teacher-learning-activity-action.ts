import { createAsyncThunk } from "@reduxjs/toolkit";
import type { Options, ResponseWrapper } from "../../../../types/global-type";
import {
  bookmarkStudentLearningActivity,
  createLearningActivity,
  getAllLearningActivityList,
  getAllSubmittedLearningActivityList,
  getLearningActivity,
  getLearningActivityOptions,
  gradeStudentLearningActivity,
  removeLearningActivity,
  updateLearningActivity,
} from "../services/learning-activity.service";
import type {
  AddStudentLearningActivityToBookmark,
  GetAllLearningActivityList,
  GetAllSubmittedLearningActivityByLearningActivityIdResp,
  GradeStudentLearningActivityData,
} from "../types/learning-activity-type.type";
import { getStudentLearningActivityDetail } from "../../../../services/student-learning-service.service";
import type { GetStudentLearningActivityDetailResp } from "../../../../types/student-learning-activity-type.type";
import type { GetLearningActivityDetailResp } from "../../../../types/activity-type.type";

export const fetchLearningActivity = createAsyncThunk<
  ResponseWrapper<GetLearningActivityDetailResp>,
  number
>("learning-activity/get", getLearningActivity);

export const postLearningActivity = createAsyncThunk<
  ResponseWrapper<{ id: number }>,
  FormData
>("learning-activity/post", createLearningActivity);

export const deleteLearningActivity = createAsyncThunk<
  ResponseWrapper<any>,
  number
>("learning-activity/remove", removeLearningActivity);

export const putLearningActivity = createAsyncThunk<
  ResponseWrapper<{ id: number }>,
  FormData
>("learning-activity/update", updateLearningActivity);

export const fetchAllLearningActivity = createAsyncThunk<
  ResponseWrapper<GetAllLearningActivityList[]>,
  number
>("learning-activity/get/all", getAllLearningActivityList);

export const fetchLearningActivityOptions = createAsyncThunk<
  ResponseWrapper<Options[]>,
  number
>("learning-activity/options", getLearningActivityOptions);

export const fetchAllSubmittedLearningActivityList = createAsyncThunk<
  ResponseWrapper<GetAllSubmittedLearningActivityByLearningActivityIdResp>,
  number
>("learning-activity/submitted/list", getAllSubmittedLearningActivityList);

export const fetchStudentLearningActivityDetail = createAsyncThunk<
  ResponseWrapper<GetStudentLearningActivityDetailResp>,
  number
>("learning-activity/detail", getStudentLearningActivityDetail);

export const postGradeStudentLearningActivity = createAsyncThunk<
  ResponseWrapper<any>,
  GradeStudentLearningActivityData
>("learning-activity/grade", gradeStudentLearningActivity);

export const patchBookmarkStudentLearningActivity = createAsyncThunk<
  ResponseWrapper<{ is_bookmark: boolean }>,
  AddStudentLearningActivityToBookmark
>("learning-activity/bookmark", bookmarkStudentLearningActivity);
