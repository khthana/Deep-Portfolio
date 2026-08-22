import type {
  EnrolledSubject,
  PortfolioSectionAttachment,
  SectionActivityOption,
  SubmissionWithCourse,
} from "@deep-portfolio/api-types";
import { axiosInstance } from "../lib/axios";
import type { ResponseWrapper } from "../types/global-type";

// EnrolledSubject and ActivityOption used to be declared here. Both moved to
// @deep-portfolio/api-types (#68) — the second under the name
// SectionActivityOption, because "activity option" says nothing about which
// activities are on offer, and the answer is "the ones in one section". Its
// copy also stopped at four fields, leaving out the score and the feedback the
// endpoint sends beside each submission, and typed the status as a bare string.

/** The subjects the signed-in student is enrolled in. Takes no id: the API
 *  reads it from the session (#40). */
export const getEnrolledSubjects = async () => {
  const resp = await axiosInstance.get<ResponseWrapper<EnrolledSubject[]>>(
    "/student/enrolled/subjects",
  );
  return resp.data;
};

/** The work in one section, with the signed-in student's own answers beside it.
 *  Takes no id, for the same reason getEnrolledSubjects does not (#41). */
export const getActivitiesBySectionId = async (sectionId: number) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<SectionActivityOption[]>
  >("/student/activities/list", { params: { section_id: sectionId } });
  return resp.data;
};

/** One of my submissions, with the subject it was handed in for. The `course`
 *  key is absent — not null — when the activity names no section (ADR-0033). */
export const getActivityDetails = async (studentActivityId: number) => {
  const resp = await axiosInstance.get<ResponseWrapper<SubmissionWithCourse>>(
    `/student/activities/details/${studentActivityId}`,
  );
  return resp.data;
};

/** The files and links handed in with one submission, flattened into one list.
 *  The same shape the e-Portfolio's six file-carrying sections answer, which is
 *  where the name comes from — see ADR-0041 and ADR-0045. */
export const getStudentActivityAttachments = async (
  studentActivityId: number,
) => {
  const resp = await axiosInstance.get<
    ResponseWrapper<PortfolioSectionAttachment[]>
  >("/student-activity/attachments", {
    params: { student_activity_id: studentActivityId },
  });
  return resp.data;
};
