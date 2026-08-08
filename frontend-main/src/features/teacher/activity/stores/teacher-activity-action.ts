import { createAsyncThunk } from "@reduxjs/toolkit";
import type { Options, ResponseWrapper } from "../../../../types/global-type";
import {
  getSharedRubric,
  getSharedRubricDetail,
} from "../services/rubric-service.service";
import type {
  SharedRubricDetailResp,
  SharedRubricResp,
} from "../types/rubric-type.type";
import {
  bookmarkStudentActivity,
  createActivity,
  getActivity,
  getActivityOptions,
  getAllActivityList,
  getAllSubmittedActivityList,
  gradeStudentActivity,
  removeActivity,
  updateActivity,
  validateActivityCLOMapping,
} from "../services/activity-service.service";
import type {
  AddStudentActivityToBookmark,
  GetAllActivityList,
  GetAllSubmittedActivityByActivityIdResp,
  GradeStudentActivityData,
  GradeStudentActivityResp,
} from "../types/activity-type.type";
import { getStudentActivityDetail } from "../../../../services/student-activity-service.service";
import type { GetStudentActivityDetailResp } from "../../../../types/student-activity-type.type";
import type { GetActivityDetailResp } from "../../../../types/activity-type.type";

export const fetchSharedRubric = createAsyncThunk<
  ResponseWrapper<SharedRubricResp[]>,
  string
>("shared-rubric", getSharedRubric);

export const fetchSharedRubricDetail = createAsyncThunk<
  ResponseWrapper<SharedRubricDetailResp[]>,
  number
>("shared-rubric/detail", getSharedRubricDetail);

//---------------------------------------------------

export const fetchActivity = createAsyncThunk<
  ResponseWrapper<GetActivityDetailResp>,
  number
>("activity/detail", getActivity);

export const postActivity = createAsyncThunk<
  ResponseWrapper<{ id: number }>,
  FormData
>("activity/add", createActivity);

export const deleteActivity = createAsyncThunk<
  ResponseWrapper<{ id: number }>,
  number
>("activity/delete", removeActivity);

export const putActivity = createAsyncThunk<
  ResponseWrapper<{ id: number }>,
  FormData
>("activity/update", updateActivity);

export const fetchAllActivity = createAsyncThunk<
  ResponseWrapper<GetAllActivityList[]>,
  number
>("activity", getAllActivityList);

export const fetchActivityOptions = createAsyncThunk<
  ResponseWrapper<Options[]>,
  number
>("activity/options", getActivityOptions);

export const fetchAllSubmittedActivityList = createAsyncThunk<
  ResponseWrapper<GetAllSubmittedActivityByActivityIdResp>,
  number
>("activity/submitted/list", getAllSubmittedActivityList);

//----------------------------------------------------

export const fetchStudentActivityDetail = createAsyncThunk<
  ResponseWrapper<GetStudentActivityDetailResp>,
  number
>("activity/student/detail", getStudentActivityDetail);

export const postGradeStudentActivity = createAsyncThunk<
  ResponseWrapper<GradeStudentActivityResp>,
  GradeStudentActivityData
>("activity/grading", gradeStudentActivity);

export const patchBookmarkStudentActivity = createAsyncThunk<
  ResponseWrapper<{ is_bookmark: boolean }>,
  AddStudentActivityToBookmark
>("activity/bookmark", bookmarkStudentActivity);

export const getValidateActivityCLOMapping = createAsyncThunk<
  ResponseWrapper<boolean>,
  number
>("activity/validate", validateActivityCLOMapping);
