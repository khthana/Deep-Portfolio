import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import {
  editCLO,
  editScoreWeight,
  fetchCLO,
  fetchPLO,
  fetchScoreWeight,
  fetchScoreWeightOptions,
  postCLO,
  postCreateCourseSectionSchedule,
  postScoreWeight,
  removeCLO,
  removeScoreWeight,
} from "./teacher-course-action";
import type { CLOResp } from "../../../../types/course-type.type";

type TeacherCourseSlice = {
  postScoreWeightLoading: boolean;
  fetchScoreWeightLoading: boolean;
  editScoreWeightLoading: boolean;
  removeScoreWeightLoading: boolean;
  fetchScoreWeightOptionsLoading: boolean;

  postCLOLoading: boolean;
  fetchCLOLoading: boolean;
  editCLOLoading: boolean;
  removeCLOLoading: boolean;

  fetchPLOLoading: boolean;
  postCreateCourseSectionScheduleLoading: boolean;

  cloData: CLOResp[];

  error: string | null;
};

const initialState: TeacherCourseSlice = {
  postScoreWeightLoading: false,
  fetchScoreWeightLoading: false,
  editScoreWeightLoading: false,
  removeScoreWeightLoading: false,
  fetchScoreWeightOptionsLoading: false,

  postCLOLoading: false,
  fetchCLOLoading: false,
  editCLOLoading: false,
  removeCLOLoading: false,

  fetchPLOLoading: false,
  postCreateCourseSectionScheduleLoading: false,

  cloData: [],

  error: null,
};

export const teacherCourseSlice = createSlice({
  name: "teacherCourse",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(postScoreWeight.pending, (state) => {
        state.postScoreWeightLoading = true;
      })
      .addCase(postScoreWeight.fulfilled, (state, action) => {
        state.postScoreWeightLoading = false;
      })
      .addCase(postScoreWeight.rejected, (state, action) => {
        state.postScoreWeightLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(fetchScoreWeight.pending, (state) => {
        state.fetchScoreWeightLoading = true;
      })
      .addCase(fetchScoreWeight.fulfilled, (state, action) => {
        state.fetchScoreWeightLoading = false;
      })
      .addCase(fetchScoreWeight.rejected, (state, action) => {
        state.fetchScoreWeightLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(editScoreWeight.pending, (state) => {
        state.editScoreWeightLoading = true;
      })
      .addCase(editScoreWeight.fulfilled, (state, action) => {
        state.editScoreWeightLoading = false;
      })
      .addCase(editScoreWeight.rejected, (state, action) => {
        state.editScoreWeightLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(removeScoreWeight.pending, (state) => {
        state.removeScoreWeightLoading = true;
      })
      .addCase(removeScoreWeight.fulfilled, (state, action) => {
        state.removeScoreWeightLoading = false;
      })
      .addCase(removeScoreWeight.rejected, (state, action) => {
        state.removeScoreWeightLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(fetchScoreWeightOptions.pending, (state) => {
        state.fetchScoreWeightOptionsLoading = true;
      })
      .addCase(fetchScoreWeightOptions.fulfilled, (state, action) => {
        state.fetchScoreWeightOptionsLoading = false;
      })
      .addCase(fetchScoreWeightOptions.rejected, (state, action) => {
        state.fetchScoreWeightOptionsLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    //------------------------------------------------------------------

    builder
      .addCase(postCLO.pending, (state) => {
        state.postCLOLoading = true;
      })
      .addCase(postCLO.fulfilled, (state, action) => {
        state.postCLOLoading = false;
      })
      .addCase(postCLO.rejected, (state, action) => {
        state.postCLOLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(fetchCLO.pending, (state) => {
        state.fetchCLOLoading = true;
      })
      .addCase(fetchCLO.fulfilled, (state, action) => {
        state.fetchCLOLoading = false;
        state.cloData = action.payload.data;
      })
      .addCase(fetchCLO.rejected, (state, action) => {
        state.fetchCLOLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(editCLO.pending, (state) => {
        state.editCLOLoading = true;
      })
      .addCase(editCLO.fulfilled, (state, action) => {
        state.editCLOLoading = false;
      })
      .addCase(editCLO.rejected, (state, action) => {
        state.editCLOLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(removeCLO.pending, (state) => {
        state.removeCLOLoading = true;
      })
      .addCase(removeCLO.fulfilled, (state, action) => {
        state.removeCLOLoading = false;
      })
      .addCase(removeCLO.rejected, (state, action) => {
        state.removeCLOLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    //------------------------------------------------------------------

    builder
      .addCase(fetchPLO.pending, (state) => {
        state.fetchPLOLoading = true;
      })
      .addCase(fetchPLO.fulfilled, (state, action) => {
        state.fetchPLOLoading = false;
      })
      .addCase(fetchPLO.rejected, (state, action) => {
        state.fetchPLOLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    //------------------------------------------------------------------

    builder
      .addCase(postCreateCourseSectionSchedule.pending, (state) => {
        state.postCreateCourseSectionScheduleLoading = true;
      })
      .addCase(postCreateCourseSectionSchedule.fulfilled, (state, action) => {
        state.postCreateCourseSectionScheduleLoading = false;
      })
      .addCase(postCreateCourseSectionSchedule.rejected, (state, action) => {
        state.postCreateCourseSectionScheduleLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });
  },
});

export const teacherCourseSliceAction = teacherCourseSlice.actions;
