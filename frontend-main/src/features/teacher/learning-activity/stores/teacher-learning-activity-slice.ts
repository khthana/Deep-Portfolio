import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import {
  fetchAllLearningActivity,
  fetchAllSubmittedLearningActivityList,
  fetchLearningActivity,
  fetchLearningActivityOptions,
  fetchStudentLearningActivityDetail,
  postGradeStudentLearningActivity,
  postLearningActivity,
  putLearningActivity,
} from "./teacher-learning-activity-action";

type TeacherActivitySlice = {
  postLearningActivityLoading: boolean;
  fetchAllLearningActivity: boolean;
  fetchLearningActivityOptions: boolean;
  fetchAllSubmittedLearningActivityList: boolean;
  fetchStudentLearningActivityDetail: boolean;
  postGradeStudentLearningActivity: boolean;
  fetchLearningActivityLoading: boolean;
  putLearningActivityLoading: boolean;

  error: string | null;
};

const initialState: TeacherActivitySlice = {
  postLearningActivityLoading: false,
  fetchAllLearningActivity: false,
  fetchLearningActivityOptions: false,
  fetchAllSubmittedLearningActivityList: false,
  fetchStudentLearningActivityDetail: false,
  postGradeStudentLearningActivity: false,
  fetchLearningActivityLoading: false,
  putLearningActivityLoading: false,

  error: null,
};

export const teacherLearningActivitySlice = createSlice({
  name: "teacherLearningActivity",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
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

    builder
      .addCase(putLearningActivity.pending, (state) => {
        state.putLearningActivityLoading = true;
      })
      .addCase(putLearningActivity.fulfilled, (state, action) => {
        state.putLearningActivityLoading = false;
      })
      .addCase(putLearningActivity.rejected, (state, action) => {
        state.putLearningActivityLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(postLearningActivity.pending, (state) => {
        state.postLearningActivityLoading = true;
      })
      .addCase(postLearningActivity.fulfilled, (state, action) => {
        state.postLearningActivityLoading = false;
      })
      .addCase(postLearningActivity.rejected, (state, action) => {
        state.postLearningActivityLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(fetchAllLearningActivity.pending, (state) => {
        state.fetchAllLearningActivity = true;
      })
      .addCase(fetchAllLearningActivity.fulfilled, (state, action) => {
        state.fetchAllLearningActivity = false;
      })
      .addCase(fetchAllLearningActivity.rejected, (state, action) => {
        state.fetchAllLearningActivity = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(fetchLearningActivityOptions.pending, (state) => {
        state.fetchLearningActivityOptions = true;
      })
      .addCase(fetchLearningActivityOptions.fulfilled, (state, action) => {
        state.fetchLearningActivityOptions = false;
      })
      .addCase(fetchLearningActivityOptions.rejected, (state, action) => {
        state.fetchLearningActivityOptions = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(fetchAllSubmittedLearningActivityList.pending, (state) => {
        state.fetchAllSubmittedLearningActivityList = true;
      })
      .addCase(
        fetchAllSubmittedLearningActivityList.fulfilled,
        (state, action) => {
          state.fetchAllSubmittedLearningActivityList = false;
        },
      )
      .addCase(
        fetchAllSubmittedLearningActivityList.rejected,
        (state, action) => {
          state.fetchAllSubmittedLearningActivityList = false;
          state.error = action.error.message ?? "Something went wrong";
        },
      );

    builder
      .addCase(fetchStudentLearningActivityDetail.pending, (state) => {
        state.fetchStudentLearningActivityDetail = true;
      })
      .addCase(
        fetchStudentLearningActivityDetail.fulfilled,
        (state, action) => {
          state.fetchStudentLearningActivityDetail = false;
        },
      )
      .addCase(fetchStudentLearningActivityDetail.rejected, (state, action) => {
        state.fetchStudentLearningActivityDetail = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(postGradeStudentLearningActivity.pending, (state) => {
        state.postGradeStudentLearningActivity = true;
      })
      .addCase(postGradeStudentLearningActivity.fulfilled, (state, action) => {
        state.postGradeStudentLearningActivity = false;
      })
      .addCase(postGradeStudentLearningActivity.rejected, (state, action) => {
        state.postGradeStudentLearningActivity = false;
        state.error = action.error.message ?? "Something went wrong";
      });
  },
});

export const teacherLearningActivitySliceAction =
  teacherLearningActivitySlice.actions;
