import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import {
  postLessonPlan,
  fetchLessonPlan,
  editLessonPlan,
  removeLessonPlan,
  fetchLessonPlanOptions,
} from "./teacher-lesson-plan-action";

type TeacherLessonPlanSlice = {
  postLessonPlanLoading: boolean;
  fetchLessonPlanLoading: boolean;
  editLessonPlanLoading: boolean;
  removeLessonPlanLoading: boolean;
  fetchLessonPlanOptionsLoading: boolean;

  error: string | null;
};

const initialState: TeacherLessonPlanSlice = {
  postLessonPlanLoading: false,
  fetchLessonPlanLoading: false,
  editLessonPlanLoading: false,
  removeLessonPlanLoading: false,
  fetchLessonPlanOptionsLoading: false,

  error: null,
};

export const teacherLessonPlanSlice = createSlice({
  name: "teacherLessonPlan",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(postLessonPlan.pending, (state) => {
        state.postLessonPlanLoading = true;
      })
      .addCase(postLessonPlan.fulfilled, (state, action) => {
        state.postLessonPlanLoading = false;
      })
      .addCase(postLessonPlan.rejected, (state, action) => {
        state.postLessonPlanLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(fetchLessonPlan.pending, (state) => {
        state.fetchLessonPlanLoading = true;
      })
      .addCase(fetchLessonPlan.fulfilled, (state, action) => {
        state.fetchLessonPlanLoading = false;
      })
      .addCase(fetchLessonPlan.rejected, (state, action) => {
        state.fetchLessonPlanLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(editLessonPlan.pending, (state) => {
        state.editLessonPlanLoading = true;
      })
      .addCase(editLessonPlan.fulfilled, (state, action) => {
        state.editLessonPlanLoading = false;
      })
      .addCase(editLessonPlan.rejected, (state, action) => {
        state.editLessonPlanLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(removeLessonPlan.pending, (state) => {
        state.removeLessonPlanLoading = true;
      })
      .addCase(removeLessonPlan.fulfilled, (state, action) => {
        state.removeLessonPlanLoading = false;
      })
      .addCase(removeLessonPlan.rejected, (state, action) => {
        state.removeLessonPlanLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(fetchLessonPlanOptions.pending, (state) => {
        state.fetchLessonPlanOptionsLoading = true;
      })
      .addCase(fetchLessonPlanOptions.fulfilled, (state, action) => {
        state.fetchLessonPlanOptionsLoading = false;
      })
      .addCase(fetchLessonPlanOptions.rejected, (state, action) => {
        state.fetchLessonPlanOptionsLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });
  },
});

export const teacherLessonPlanSliceAction = teacherLessonPlanSlice.actions;
