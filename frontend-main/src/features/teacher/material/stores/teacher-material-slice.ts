import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import {
  fetchCourseMaterial,
  postCourseMaterial,
  removeCourseMaterial,
} from "./teacher-material-action";
import type { GetCourseMaterialDetailResp } from "../types/course-material-type";

type TeacherCourseMaterialSlice = {
  postCourseMaterialLoading: boolean;
  fetchCourseMaterialLoading: boolean;
  editCourseMaterialLoading: boolean;
  removeCourseMaterialLoading: boolean;
  fetchCourseMaterialOptionsLoading: boolean;

  courseMaterialData: GetCourseMaterialDetailResp[] | null;

  error: string | null;
};

const initialState: TeacherCourseMaterialSlice = {
  postCourseMaterialLoading: false,
  fetchCourseMaterialLoading: false,
  editCourseMaterialLoading: false,
  removeCourseMaterialLoading: false,
  fetchCourseMaterialOptionsLoading: false,

  courseMaterialData: null,

  error: null,
};

export const teacherCourseMaterialSlice = createSlice({
  name: "teacherCourseMaterial",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(postCourseMaterial.pending, (state) => {
        state.postCourseMaterialLoading = true;
      })
      .addCase(postCourseMaterial.fulfilled, (state, action) => {
        state.postCourseMaterialLoading = false;
      })
      .addCase(postCourseMaterial.rejected, (state, action) => {
        state.postCourseMaterialLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(fetchCourseMaterial.pending, (state) => {
        state.fetchCourseMaterialLoading = true;
      })
      .addCase(fetchCourseMaterial.fulfilled, (state, action) => {
        state.fetchCourseMaterialLoading = false;
        state.courseMaterialData = action.payload.data;
      })
      .addCase(fetchCourseMaterial.rejected, (state, action) => {
        state.fetchCourseMaterialLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(removeCourseMaterial.pending, (state) => {
        state.removeCourseMaterialLoading = true;
      })
      .addCase(removeCourseMaterial.fulfilled, (state, action) => {
        state.removeCourseMaterialLoading = false;
      })
      .addCase(removeCourseMaterial.rejected, (state, action) => {
        state.removeCourseMaterialLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });
  },
});

export const teacherCourseMaterialSliceAction =
  teacherCourseMaterialSlice.actions;
