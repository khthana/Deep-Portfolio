import { endpoints } from "../../../../configs/endpoints.config";
import { axiosInstance } from "../../../../lib/axios";
import type {
  CourseDetail,
  StudentActivityDetailResp,
  StudentEvaluationListResp,
  StudentLearningActivityDetailResp,
} from "@deep-portfolio/api-types";
import type { ResponseWrapper } from "../../../../types/global-type";
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
  GetStudentLessonPlanWithMaterialResp,
  ResendInviteBody,
} from "../types/course-type";

export const getStudentCourseList = async (
  params: GetStudentCourseListParams,
) => {
  const resp = await axiosInstance.get<ResponseWrapper<CourseDetail[]>>(
    endpoints.student.course,
    { params: params },
  );

  return resp.data;
};

export const getStudentCourseClassworkList = async (
  params: GetStudentClassworkListParams,
) => {
  const resp = await axiosInstance.get<ResponseWrapper<ClassworkDetailResp>>(
    endpoints.student.classwork,
    { params: params },
  );

  return resp.data;
};

//--------------------------------------------------------

export const submitActivity = async (formData: FormData) => {
  const resp = await axiosInstance.post<
    ResponseWrapper<StudentActivityDetailResp>
  >(endpoints.student.submit.activity, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return resp.data;
};

export const submitLearningActivity = async (formData: FormData) => {
  const resp = await axiosInstance.post<
    ResponseWrapper<StudentLearningActivityDetailResp>
  >(endpoints.student.submit.learning_activity, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return resp.data;
};

//--------------------------------------------------------

export const createStudentActivityGroup = async (
  body: CreateStudentActivityGroupBody,
) => {
  const resp = await axiosInstance.post<ResponseWrapper<{ group_id: number }>>(
    endpoints.student_activity_group.root,
    body,
  );

  return resp.data;
};

export const updateStudentActivityGroup = async (
  body: UpdateStudentActivityGroupBody,
) => {
  const resp = await axiosInstance.patch<ResponseWrapper<{ group_id: number }>>(
    endpoints.student_activity_group.root,
    body,
  );

  return resp.data;
};

/** Answers with nothing but the wrapper: the new token is mailed to the member,
 *  never handed back to the leader who asked for it (#57). */
export const resendStudentActivityGroupInvite = async (
  body: ResendInviteBody,
) => {
  const resp = await axiosInstance.post<ResponseWrapper<null>>(
    endpoints.student_activity_group.resend_invite,
    body,
  );

  return resp.data;
};

export const getStudentActivityGroup = async (
  params: GetStudentActivityGroupParams,
) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<GetStudentActivityGroupResp | null>
  >(endpoints.student_activity_group.root, {
    params: params,
  });

  return resp.data;
};

export const getStudentActivityGroupInSec = async (
  params: GetStudentActivityGroupInSecParams,
) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<GetStudentActivityGroupResp[]>
  >(endpoints.student_activity_group.all, {
    params: params,
  });

  return resp.data;
};

export const getStudentWithoutGroup = async (
  params: GetStudentWithoutGroupParams,
) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<GetStudentWithoutGroupResp[]>
  >(endpoints.student_activity_group.without_group, {
    params: params,
  });

  return resp.data;
};

//--------------------------------------------------------

export const createStudentLearningActivityGroup = async (
  body: CreateStudentLearningActivityGroupBody,
) => {
  const resp = await axiosInstance.post<ResponseWrapper<{ group_id: number }>>(
    endpoints.student_learning_activity_group.root,
    body,
  );

  return resp.data;
};

export const updateStudentLearningActivityGroup = async (
  body: UpdateStudentLearningActivityGroupBody,
) => {
  const resp = await axiosInstance.patch<ResponseWrapper<{ group_id: number }>>(
    endpoints.student_learning_activity_group.root,
    body,
  );

  return resp.data;
};

export const resendStudentLearningActivityGroupInvite = async (
  body: ResendInviteBody,
) => {
  const resp = await axiosInstance.post<ResponseWrapper<null>>(
    endpoints.student_learning_activity_group.resend_invite,
    body,
  );

  return resp.data;
};

export const getStudentLearningActivityGroup = async (
  params: GetStudentLearningActivityGroupParams,
) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<GetStudentActivityGroupResp | null>
  >(endpoints.student_learning_activity_group.root, {
    params: params,
  });

  return resp.data;
};

export const getStudentLearningActivityGroupInSec = async (
  params: GetStudentActivityGroupInSecParams,
) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<GetStudentActivityGroupResp[]>
  >(endpoints.student_learning_activity_group.all, {
    params: params,
  });

  return resp.data;
};

export const getStudentLearningActivityWithoutGroup = async (
  params: GetStudentLearningActivityWithoutGroupParams,
) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<GetStudentWithoutGroupResp[]>
  >(endpoints.student_learning_activity_group.without_group, {
    params: params,
  });

  return resp.data;
};

//--------------------------------------------------------

export const getStudentEvaluationList = async (
  params: GetStudentEvaluationListParams,
) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<StudentEvaluationListResp>
  >(endpoints.evaluation.list, {
    params,
  });

  return resp.data;
};

//----------------------------------------------------------

export const getStudentLessonPlanWithMaterial = async (section_id: number) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<GetStudentLessonPlanWithMaterialResp[]>
  >(endpoints.lesson_plan.student, { params: { section_id } });

  return resp.data;
};
