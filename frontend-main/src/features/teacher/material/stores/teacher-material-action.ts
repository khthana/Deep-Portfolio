import { createAsyncThunk } from "@reduxjs/toolkit";
import type { ResponseWrapper } from "../../../../types/global-type";
import {
  createCourseMaterial,
  deleteCourseMaterial,
  getCourseMaterial,
} from "../services/teacher-material.service";
import type { GetCourseMaterialDetailResp } from "../types/course-material-type";

export const fetchCourseMaterial = createAsyncThunk<
  ResponseWrapper<GetCourseMaterialDetailResp[]>,
  number
>("course-material", getCourseMaterial);

export const postCourseMaterial = createAsyncThunk<
  ResponseWrapper<any>,
  FormData
>("course-material/create", createCourseMaterial);

export const removeCourseMaterial = createAsyncThunk<
  ResponseWrapper<any>,
  number
>("course-material/delete", deleteCourseMaterial);
