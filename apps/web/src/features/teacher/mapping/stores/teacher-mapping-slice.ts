import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import {
  fetchActivity,
  fetchLearningActivity,
  postActivityCLOMapping,
  postLearningActivityCLOMapping,
} from "./teacher-mapping-action";

type TeacherActivityCLOMappingSlice = {
  postActivityCLOMappingLoading: boolean;
  fetchActivityLoading: boolean;

  fetchLearningActivityLoading: boolean;
  postLearningActivityCLOMappingLoading: boolean;

  error: string | null;
};

const initialState: TeacherActivityCLOMappingSlice = {
  postActivityCLOMappingLoading: false,
  fetchActivityLoading: false,

  fetchLearningActivityLoading: false,
  postLearningActivityCLOMappingLoading: false,

  error: null,
};

export const teacherActivityCLOMappingSlice = createSlice({
  name: "teacherActivityCLOMapping",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(postActivityCLOMapping.pending, (state) => {
        state.postActivityCLOMappingLoading = true;
      })
      .addCase(postActivityCLOMapping.fulfilled, (state, action) => {
        state.postActivityCLOMappingLoading = false;
      })
      .addCase(postActivityCLOMapping.rejected, (state, action) => {
        state.postActivityCLOMappingLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(fetchActivity.pending, (state) => {
        state.fetchActivityLoading = true;
      })
      .addCase(fetchActivity.fulfilled, (state, action) => {
        state.fetchActivityLoading = false;
      })
      .addCase(fetchActivity.rejected, (state, action) => {
        state.fetchActivityLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(postLearningActivityCLOMapping.pending, (state) => {
        state.postLearningActivityCLOMappingLoading = true;
      })
      .addCase(postLearningActivityCLOMapping.fulfilled, (state, action) => {
        state.postLearningActivityCLOMappingLoading = false;
      })
      .addCase(postLearningActivityCLOMapping.rejected, (state, action) => {
        state.postLearningActivityCLOMappingLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(fetchLearningActivity.pending, (state) => {
        state.fetchLearningActivityLoading = true;
      })
      .addCase(fetchLearningActivity.fulfilled, (state, action) => {
        state.fetchLearningActivityLoading = false;
      })
      .addCase(fetchLearningActivity.rejected, (state, action) => {
        state.fetchLearningActivityLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });
  },
});

export const teacherActivityCLOMappingSliceAction =
  teacherActivityCLOMappingSlice.actions;
