import { createAsyncThunk } from "@reduxjs/toolkit";
import type { ResponseWrapper } from "../../../../types/global-type";
import {
  createStudentActivityGroup,
  getStudentActivityGroup,
  getStudentActivityGroupInSec,
  getStudentCourseClassworkList,
  getStudentCourseList,
  getStudentEvaluationList,
  getStudentLearningActivityGroupInSec,
  getStudentLearningActivityWithoutGroup,
  getStudentLessonPlanWithMaterial,
  getStudentWithoutGroup,
  submitActivity,
  submitLearningActivity,
  updateStudentActivityGroup,
} from "../services/course-service.service";
import type {
  ClassworkDetailResp,
  CreateStudentActivityGroupBody,
  GetStudentActivityGroupInSecParams,
  GetStudentActivityGroupParams,
  GetStudentActivityGroupResp,
  GetStudentClassworkListParams,
  GetStudentCourseListParams,
  GetStudentWithoutGroupResp,
  GetStudentWithoutGroupParams,
  UpdateStudentActivityGroupBody,
  CreateStudentLearningActivityGroupBody,
  UpdateStudentLearningActivityGroupBody,
  GetStudentLearningActivityGroupParams,
  GetStudentLearningActivityWithoutGroupParams,
  GetStudentEvaluationListParams,
  GetStudentEvaluationListResp,
  GetStudentLessonPlanWithMaterialResp,
} from "../types/course-type";
import type {
  AnnouncementDetailResp,
  CourseDetail,
  LessonPlanResp,
  ScoreWeightResp,
} from "../../../../types/course-type.type";
import {
  getCourseById,
  getLessonPlan,
  getScoreWeight,
} from "../../../../services/course-service.service";
import { getCLO } from "../../../../services/course-service.service";
import type { CLOResp } from "../../../../types/course-type.type";
import { getAllAnnouncements } from "../../../../services/announcement-service.service";
import { getStudentActivityDetail } from "../../../../services/student-activity-service.service";
import type { GetStudentActivityDetailResp } from "../../../../types/student-activity-type.type";
import { getStudentLearningActivityDetail } from "../../../../services/student-learning-service.service";
import type { GetStudentLearningActivityDetailResp } from "../../../../types/student-learning-activity-type.type";
import {
  createStudentLearningActivityGroup,
  getStudentLearningActivityGroup,
  updateStudentLearningActivityGroup,
} from "../services/course-service.service";

export const fetchStudentCourseList = createAsyncThunk<
  ResponseWrapper<CourseDetail[]>,
  GetStudentCourseListParams
>("student/course/list", getStudentCourseList);

export const fetchCourseDetail = createAsyncThunk<
  ResponseWrapper<CourseDetail>,
  number
>("student/course", getCourseById);

export const fetchCLO = createAsyncThunk<ResponseWrapper<CLOResp[]>, number>(
  "student/clo",
  getCLO,
);

export const fetchScoreWeight = createAsyncThunk<
  ResponseWrapper<ScoreWeightResp[]>,
  number
>("student/score-weight", getScoreWeight);

export const fetchStudentLessonPlanWithMaterial = createAsyncThunk<
  ResponseWrapper<GetStudentLessonPlanWithMaterialResp[]>,
  number
>("student/lesson-plan", getStudentLessonPlanWithMaterial);

export const fetchAllAnnouncement = createAsyncThunk<
  ResponseWrapper<AnnouncementDetailResp[]>,
  number
>("student/announcement", getAllAnnouncements);

export const fetchStudentActivityDetail = createAsyncThunk<
  ResponseWrapper<GetStudentActivityDetailResp>,
  number
>("student/activity", getStudentActivityDetail);

export const fetchLearningActivityDetail = createAsyncThunk<
  ResponseWrapper<GetStudentLearningActivityDetailResp>,
  number
>("student/learning-activity", getStudentLearningActivityDetail);

export const fetchCourseClasswork = createAsyncThunk<
  ResponseWrapper<ClassworkDetailResp>,
  GetStudentClassworkListParams
>("student/classwork", getStudentCourseClassworkList);

//---------------------------------------------------------

export const postSubmitActivity = createAsyncThunk<
  ResponseWrapper<GetStudentActivityDetailResp>,
  FormData
>("student/submit/activity", submitActivity);

export const postSubmitLearningActivity = createAsyncThunk<
  ResponseWrapper<GetStudentLearningActivityDetailResp>,
  FormData
>("student/submit/learning-activity", submitLearningActivity);

//---------------------------------------------------------

export const postStudentActivityGroup = createAsyncThunk<
  ResponseWrapper<{ group_id: number }>,
  CreateStudentActivityGroupBody
>("student/group/create", createStudentActivityGroup);

export const patchStudentActivityGroup = createAsyncThunk<
  ResponseWrapper<{ group_id: number }>,
  UpdateStudentActivityGroupBody
>("student/group/update", updateStudentActivityGroup);

export const fetchStudentActivityGroup = createAsyncThunk<
  ResponseWrapper<GetStudentActivityGroupResp | null>,
  GetStudentActivityGroupParams
>("student/group", getStudentActivityGroup);

export const fetchStudentActivityGroupInSec = createAsyncThunk<
  ResponseWrapper<GetStudentActivityGroupResp[]>,
  GetStudentActivityGroupInSecParams
>("student/group/all", getStudentActivityGroupInSec);

export const fetchStudentWithoutGroup = createAsyncThunk<
  ResponseWrapper<GetStudentWithoutGroupResp[]>,
  GetStudentWithoutGroupParams
>("student/without-group", getStudentWithoutGroup);

//---------------------------------------------------------

export const postStudentLearningActivityGroup = createAsyncThunk<
  ResponseWrapper<{ group_id: number }>,
  CreateStudentLearningActivityGroupBody
>("student/learning-activity-group/create", createStudentLearningActivityGroup);

export const patchStudentLearningActivityGroup = createAsyncThunk<
  ResponseWrapper<{ group_id: number }>,
  UpdateStudentLearningActivityGroupBody
>("student/learning-activity-group/update", updateStudentLearningActivityGroup);

export const fetchStudentLearningActivityGroup = createAsyncThunk<
  ResponseWrapper<GetStudentActivityGroupResp | null>,
  GetStudentLearningActivityGroupParams
>("student/learning-activity-group", getStudentLearningActivityGroup);

export const fetchStudentLearningActivityGroupInSec = createAsyncThunk<
  ResponseWrapper<GetStudentActivityGroupResp[]>,
  GetStudentActivityGroupInSecParams
>("student/learning-activity-group/all", getStudentLearningActivityGroupInSec);

export const fetchStudentLearningActivityWithoutGroup = createAsyncThunk<
  ResponseWrapper<GetStudentWithoutGroupResp[]>,
  GetStudentLearningActivityWithoutGroupParams
>(
  "student/learning-activity-group/without-group",
  getStudentLearningActivityWithoutGroup,
);

export const fetchStudentEvaluationList = createAsyncThunk<
  ResponseWrapper<GetStudentEvaluationListResp>,
  GetStudentEvaluationListParams
>("student/evaluation/list", getStudentEvaluationList);
