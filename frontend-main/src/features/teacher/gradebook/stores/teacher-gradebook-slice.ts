import { createSlice } from "@reduxjs/toolkit";
import {
  fetchGradebookPerActivity,
  fetchGradebookPerStudent,
} from "./teacher-gradebook-action";

type TeacherGradebookSlice = {
  fetchAllStudentInSectionLoading: boolean;
  fetchGradebookPerStudentLoading: boolean;
  fetchGradebookPerActivityLoading: boolean;

  error: string | null;
};

const initialState: TeacherGradebookSlice = {
  fetchAllStudentInSectionLoading: false,
  fetchGradebookPerStudentLoading: false,
  fetchGradebookPerActivityLoading: false,

  error: null,
};

export const teacherGradebookSlice = createSlice({
  name: "teacherGradebook",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchGradebookPerStudent.pending, (state) => {
        state.fetchGradebookPerStudentLoading = true;
      })
      .addCase(fetchGradebookPerStudent.fulfilled, (state, action) => {
        state.fetchGradebookPerStudentLoading = false;
      })
      .addCase(fetchGradebookPerStudent.rejected, (state, action) => {
        state.fetchGradebookPerStudentLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(fetchGradebookPerActivity.pending, (state) => {
        state.fetchGradebookPerActivityLoading = true;
      })
      .addCase(fetchGradebookPerActivity.fulfilled, (state, action) => {
        state.fetchGradebookPerActivityLoading = false;
      })
      .addCase(fetchGradebookPerActivity.rejected, (state, action) => {
        state.fetchGradebookPerActivityLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });
  },
});

export const teacherGradebookSliceAction = teacherGradebookSlice.actions;
