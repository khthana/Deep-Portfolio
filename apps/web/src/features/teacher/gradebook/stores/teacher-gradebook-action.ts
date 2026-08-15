import { createAsyncThunk } from "@reduxjs/toolkit";
import type {
  GradebookPerActivityResp,
  GradebookPerStudentResp,
} from "@deep-portfolio/api-types";
import type { ResponseWrapper } from "../../../../types/global-type";
import {
  getGradebookPerStudent,
  getGradebookPerActivity,
} from "../services/gradebook-service.service";

export const fetchGradebookPerStudent = createAsyncThunk<
  ResponseWrapper<GradebookPerStudentResp>,
  {
    section_id: number;
  }
>("gradebook/per-student", getGradebookPerStudent);

export const fetchGradebookPerActivity = createAsyncThunk<
  ResponseWrapper<GradebookPerActivityResp>,
  {
    section_id: number;
  }
>("gradebook/per-activity", getGradebookPerActivity);
