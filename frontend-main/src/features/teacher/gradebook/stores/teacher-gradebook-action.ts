import { createAsyncThunk } from "@reduxjs/toolkit";
import type { ResponseWrapper } from "../../../../types/global-type";
import type {
  GradebookPerStudentResp,
  GradebookPerActivityResp,
} from "../types/gradebook-type.type";
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
