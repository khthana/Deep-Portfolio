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
  resendStudentActivityGroupInvite,
  submitActivity,
  submitLearningActivity,
  updateStudentActivityGroup,
} from "../services/course-service.service";
import type {
  ClassworkDetailResp,
  CreateStudentActivityGroupBody,
  GetStudentActivityGroupInSecParams,
  GetStudentActivityGroupParams,
  GetStudentClassworkListParams,
  GetStudentCourseListParams,
  GetStudentWithoutGroupParams,
  UpdateStudentActivityGroupBody,
  CreateStudentLearningActivityGroupBody,
  UpdateStudentLearningActivityGroupBody,
  GetStudentLearningActivityGroupParams,
  GetStudentLearningActivityWithoutGroupParams,
  GetStudentEvaluationListParams,
  ResendInviteBody,
} from "../types/course-type";
import type {
  CLOResp,
  CourseDetail,
  GroupDetailResp,
  GroupIdResp,
  ScoreWeightDetail,
  StudentActivityDetailResp,
  StudentEvaluationListResp,
  StudentLearningActivityDetailResp,
  StudentLessonPlanWeek,
  StudentWithoutGroup,
} from "@deep-portfolio/api-types";
import type { AnnouncementDetailResp } from "@deep-portfolio/api-types";
import {
  getCourseById,
  getScoreWeight,
} from "../../../../services/course-service.service";
import { getCLO } from "../../../../services/course-service.service";
import { getAllAnnouncements } from "../../../../services/announcement-service.service";
import { getStudentActivityDetail } from "../../../../services/student-activity-service.service";
import { getStudentLearningActivityDetail } from "../../../../services/student-learning-service.service";
import {
  createStudentLearningActivityGroup,
  getStudentLearningActivityGroup,
  resendStudentLearningActivityGroupInvite,
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
  ResponseWrapper<ScoreWeightDetail[]>,
  number
>("student/score-weight", getScoreWeight);

export const fetchStudentLessonPlanWithMaterial = createAsyncThunk<
  ResponseWrapper<StudentLessonPlanWeek[]>,
  number
>("student/lesson-plan", getStudentLessonPlanWithMaterial);

export const fetchAllAnnouncement = createAsyncThunk<
  ResponseWrapper<AnnouncementDetailResp[]>,
  number
>("student/announcement", getAllAnnouncements);

export const fetchStudentActivityDetail = createAsyncThunk<
  // `data` is absent when the id names no submission, which is what the
  // endpoint answers now rather than a body holding one empty key (#68, see
  // BEHAVIOR-CHANGES.md). Written into the type so the reducer has to say what
  // it does about it — `ResponseWrapper` itself declares `data` non-optional,
  // and correcting that is #67.
  ResponseWrapper<StudentActivityDetailResp | undefined>,
  number
>("student/activity", getStudentActivityDetail);

export const fetchLearningActivityDetail = createAsyncThunk<
  /** Absent for an id that names no submission — see above. */
  ResponseWrapper<StudentLearningActivityDetailResp | undefined>,
  number
>("student/learning-activity", getStudentLearningActivityDetail);

export const fetchCourseClasswork = createAsyncThunk<
  ResponseWrapper<ClassworkDetailResp>,
  GetStudentClassworkListParams
>("student/classwork", getStudentCourseClassworkList);

//---------------------------------------------------------

export const postSubmitActivity = createAsyncThunk<
  ResponseWrapper<StudentActivityDetailResp>,
  FormData
>("student/submit/activity", submitActivity);

export const postSubmitLearningActivity = createAsyncThunk<
  ResponseWrapper<StudentLearningActivityDetailResp>,
  FormData
>("student/submit/learning-activity", submitLearningActivity);

//---------------------------------------------------------

export const postStudentActivityGroup = createAsyncThunk<
  ResponseWrapper<GroupIdResp>,
  CreateStudentActivityGroupBody
>("student/group/create", createStudentActivityGroup);

export const patchStudentActivityGroup = createAsyncThunk<
  ResponseWrapper<GroupIdResp>,
  UpdateStudentActivityGroupBody
>("student/group/update", updateStudentActivityGroup);

export const postResendActivityGroupInvite = createAsyncThunk<
  ResponseWrapper<null>,
  ResendInviteBody
>("student/group/resend-invite", resendStudentActivityGroupInvite);

export const fetchStudentActivityGroup = createAsyncThunk<
  ResponseWrapper<GroupDetailResp | null>,
  GetStudentActivityGroupParams
>("student/group", getStudentActivityGroup);

export const fetchStudentActivityGroupInSec = createAsyncThunk<
  ResponseWrapper<GroupDetailResp[]>,
  GetStudentActivityGroupInSecParams
>("student/group/all", getStudentActivityGroupInSec);

export const fetchStudentWithoutGroup = createAsyncThunk<
  ResponseWrapper<StudentWithoutGroup[]>,
  GetStudentWithoutGroupParams
>("student/without-group", getStudentWithoutGroup);

//---------------------------------------------------------

export const postStudentLearningActivityGroup = createAsyncThunk<
  ResponseWrapper<GroupIdResp>,
  CreateStudentLearningActivityGroupBody
>("student/learning-activity-group/create", createStudentLearningActivityGroup);

export const patchStudentLearningActivityGroup = createAsyncThunk<
  ResponseWrapper<GroupIdResp>,
  UpdateStudentLearningActivityGroupBody
>("student/learning-activity-group/update", updateStudentLearningActivityGroup);

export const postResendLearningActivityGroupInvite = createAsyncThunk<
  ResponseWrapper<null>,
  ResendInviteBody
>(
  "student/learning-activity-group/resend-invite",
  resendStudentLearningActivityGroupInvite,
);

export const fetchStudentLearningActivityGroup = createAsyncThunk<
  ResponseWrapper<GroupDetailResp | null>,
  GetStudentLearningActivityGroupParams
>("student/learning-activity-group", getStudentLearningActivityGroup);

export const fetchStudentLearningActivityGroupInSec = createAsyncThunk<
  ResponseWrapper<GroupDetailResp[]>,
  GetStudentActivityGroupInSecParams
>("student/learning-activity-group/all", getStudentLearningActivityGroupInSec);

export const fetchStudentLearningActivityWithoutGroup = createAsyncThunk<
  ResponseWrapper<StudentWithoutGroup[]>,
  GetStudentLearningActivityWithoutGroupParams
>(
  "student/learning-activity-group/without-group",
  getStudentLearningActivityWithoutGroup,
);

export const fetchStudentEvaluationList = createAsyncThunk<
  ResponseWrapper<StudentEvaluationListResp>,
  GetStudentEvaluationListParams
>("student/evaluation/list", getStudentEvaluationList);
