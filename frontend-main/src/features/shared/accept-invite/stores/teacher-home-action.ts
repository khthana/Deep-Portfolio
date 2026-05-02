import { createAsyncThunk } from "@reduxjs/toolkit";
import type { ResponseWrapper } from "../../../../types/global-type";
import { getCourseById } from "../../../../services/course-service.service";
import type { CourseDetail } from "../../../../types/course-type.type";
import {
  acceptInvite,
  validateInvite,
} from "../../../../services/group-service.service";
import type {
  AcceptInviteBody,
  ValidateInvite,
} from "../../../../types/group-type.type";

export const postAcceptInvite = createAsyncThunk<
  ResponseWrapper<any>,
  AcceptInviteBody
>("group/accept-invite", acceptInvite);

export const postValidateInvite = createAsyncThunk<
  ResponseWrapper<any>,
  ValidateInvite
>("group/validate-invite", validateInvite);

// export const fetchCourseById = createAsyncThunk<
//   ResponseWrapper<CourseDetail>,
//   number
// >("teacher/course", getCourseById);
