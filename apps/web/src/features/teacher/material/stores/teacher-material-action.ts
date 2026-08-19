import { createAsyncThunk } from "@reduxjs/toolkit";
import type { ResponseWrapper } from "../../../../types/global-type";
import {
  createCourseMaterial,
  deleteCourseMaterial,
  getCourseMaterial,
} from "../services/teacher-material.service";
import type { CourseMaterialWeek } from "@deep-portfolio/api-types";

export const fetchCourseMaterial = createAsyncThunk<
  ResponseWrapper<CourseMaterialWeek[]>,
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
