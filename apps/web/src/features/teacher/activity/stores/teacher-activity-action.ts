import type {
  SharedRubric,
  SharedRubricCriterion,
} from "@deep-portfolio/api-types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { Options, ResponseWrapper } from "../../../../types/global-type";
import {
  getSharedRubric,
  getSharedRubricDetail,
} from "../services/rubric-service.service";
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
  ActivityDetailResp,
  ActivityListItem,
  ActivitySubmissionListResp,
  GradeStudentActivityResp,
  StudentActivityDetailResp,
} from "@deep-portfolio/api-types";
import type {
  AddStudentActivityToBookmark,
  GradeStudentActivityData,
} from "../types/activity-type.type";
import { getStudentActivityDetail } from "../../../../services/student-activity-service.service";

export const fetchSharedRubric = createAsyncThunk<
  ResponseWrapper<SharedRubric[]>,
  string
>("shared-rubric", getSharedRubric);

export const fetchSharedRubricDetail = createAsyncThunk<
  ResponseWrapper<SharedRubricCriterion[]>,
  number
>("shared-rubric/detail", getSharedRubricDetail);

//---------------------------------------------------

export const fetchActivity = createAsyncThunk<
  ResponseWrapper<ActivityDetailResp>,
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
  ResponseWrapper<ActivityListItem[]>,
  number
>("activity", getAllActivityList);

export const fetchActivityOptions = createAsyncThunk<
  ResponseWrapper<Options[]>,
  number
>("activity/options", getActivityOptions);

export const fetchAllSubmittedActivityList = createAsyncThunk<
  ResponseWrapper<ActivitySubmissionListResp>,
  number
>("activity/submitted/list", getAllSubmittedActivityList);

//----------------------------------------------------

export const fetchStudentActivityDetail = createAsyncThunk<
  /** Absent for an id that names no submission (#68). */
  ResponseWrapper<StudentActivityDetailResp | undefined>,
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
