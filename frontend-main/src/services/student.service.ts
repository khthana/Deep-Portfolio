import { axiosInstance } from "../lib/axios";
import type { ResponseWrapper } from "../types/global-type";

export type EnrolledSubject = {
  section_id: number;
  subject_name_en: string;
  subject_name_th: string;
};

export type ActivityOption = {
  activity_id: number;
  activity_name: string;
  student_activity_id: number | null;
  status: string | null;
};

export const getEnrolledSubjects = async (studentId: string) => {
  const resp = await axiosInstance.get<ResponseWrapper<EnrolledSubject[]>>(
    "/student/enrolled/subjects",
    { params: { student_id: studentId } },
  );
  return resp.data;
};

export const getActivitiesBySectionId = async (
  sectionId: number,
  studentId: string,
) => {
  const resp = await axiosInstance.get<ResponseWrapper<ActivityOption[]>>(
    "/student/activities/list",
    { params: { section_id: sectionId, student_id: studentId } },
  );
  return resp.data;
};
export const getActivityDetails = async (studentActivityId: number) => {
  const resp = await axiosInstance.get<ResponseWrapper<any>>(
    `/student/activities/details/${studentActivityId}`,
  );
  return resp.data;
};

export const getStudentActivityAttachments = async (
  studentActivityId: number,
) => {
  const resp = await axiosInstance.get<ResponseWrapper<any>>(
    "/student-activity/attachments",
    { params: { student_activity_id: studentActivityId } },
  );
  return resp.data;
};
