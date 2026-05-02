import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import {
  deleteActivity,
  fetchActivity,
  fetchActivityOptions,
  fetchAllActivity,
  fetchAllSubmittedActivityList,
  fetchSharedRubric,
  fetchSharedRubricDetail,
  fetchStudentActivityDetail,
  getValidateActivityCLOMapping,
  patchBookmarkStudentActivity,
  postActivity,
  postGradeStudentActivity,
  putActivity,
} from "./teacher-activity-action";

type TeacherActivitySlice = {
  fetchSharedRubricLoading: boolean;
  fetchSharedRubricDetailLoading: boolean;
  postActivityLoading: boolean;
  fetchAllActivityLoading: boolean;
  fetchActivityOptionsLoading: boolean;
  fetchAllSubmittedActivityListLoading: boolean;
  fetchStudentActivityDetailLoading: boolean;
  postGradeStudentActivityLoading: boolean;
  patchBookmarkStudentActivityLoading: boolean;
  putActivityLoading: boolean;
  fetchActivityLoading: boolean;
  getValidateActivityCLOMappingLoading: boolean;
  deleteActivityLoading: boolean;

  error: string | null;
};

const initialState: TeacherActivitySlice = {
  fetchSharedRubricLoading: false,
  fetchSharedRubricDetailLoading: false,
  postActivityLoading: false,
  fetchAllActivityLoading: false,
  fetchActivityOptionsLoading: false,
  fetchAllSubmittedActivityListLoading: false,
  fetchStudentActivityDetailLoading: false,
  postGradeStudentActivityLoading: false,
  patchBookmarkStudentActivityLoading: false,
  putActivityLoading: false,
  fetchActivityLoading: false,
  getValidateActivityCLOMappingLoading: false,
  deleteActivityLoading: false,

  error: null,
};

export const teacherActivitySlice = createSlice({
  name: "teacherActivity",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchSharedRubric.pending, (state) => {
        state.fetchSharedRubricLoading = true;
      })
      .addCase(fetchSharedRubric.fulfilled, (state, action) => {
        state.fetchSharedRubricLoading = false;
      })
      .addCase(fetchSharedRubric.rejected, (state, action) => {
        state.fetchSharedRubricLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(fetchSharedRubricDetail.pending, (state) => {
        state.fetchSharedRubricDetailLoading = true;
      })
      .addCase(fetchSharedRubricDetail.fulfilled, (state, action) => {
        state.fetchSharedRubricDetailLoading = false;
      })
      .addCase(fetchSharedRubricDetail.rejected, (state, action) => {
        state.fetchSharedRubricDetailLoading = false;
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
      .addCase(postActivity.pending, (state) => {
        state.postActivityLoading = true;
      })
      .addCase(postActivity.fulfilled, (state, action) => {
        state.postActivityLoading = false;
      })
      .addCase(postActivity.rejected, (state, action) => {
        state.postActivityLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(deleteActivity.pending, (state) => {
        state.deleteActivityLoading = true;
      })
      .addCase(deleteActivity.fulfilled, (state, action) => {
        state.deleteActivityLoading = false;
      })
      .addCase(deleteActivity.rejected, (state, action) => {
        state.deleteActivityLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(putActivity.pending, (state) => {
        state.putActivityLoading = true;
      })
      .addCase(putActivity.fulfilled, (state, action) => {
        state.putActivityLoading = false;
      })
      .addCase(putActivity.rejected, (state, action) => {
        state.putActivityLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(fetchAllActivity.pending, (state) => {
        state.fetchAllActivityLoading = true;
      })
      .addCase(fetchAllActivity.fulfilled, (state, action) => {
        state.fetchAllActivityLoading = false;
      })
      .addCase(fetchAllActivity.rejected, (state, action) => {
        state.fetchAllActivityLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(fetchActivityOptions.pending, (state) => {
        state.fetchActivityOptionsLoading = true;
      })
      .addCase(fetchActivityOptions.fulfilled, (state, action) => {
        state.fetchActivityOptionsLoading = false;
      })
      .addCase(fetchActivityOptions.rejected, (state, action) => {
        state.fetchActivityOptionsLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(fetchAllSubmittedActivityList.pending, (state) => {
        state.fetchAllSubmittedActivityListLoading = true;
      })
      .addCase(fetchAllSubmittedActivityList.fulfilled, (state, action) => {
        state.fetchAllSubmittedActivityListLoading = false;
      })
      .addCase(fetchAllSubmittedActivityList.rejected, (state, action) => {
        state.fetchAllSubmittedActivityListLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(fetchStudentActivityDetail.pending, (state) => {
        state.fetchStudentActivityDetailLoading = true;
      })
      .addCase(fetchStudentActivityDetail.fulfilled, (state, action) => {
        state.fetchStudentActivityDetailLoading = false;
      })
      .addCase(fetchStudentActivityDetail.rejected, (state, action) => {
        state.fetchStudentActivityDetailLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(postGradeStudentActivity.pending, (state) => {
        state.postGradeStudentActivityLoading = true;
      })
      .addCase(postGradeStudentActivity.fulfilled, (state, action) => {
        state.postGradeStudentActivityLoading = false;
      })
      .addCase(postGradeStudentActivity.rejected, (state, action) => {
        state.postGradeStudentActivityLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(patchBookmarkStudentActivity.pending, (state) => {
        state.patchBookmarkStudentActivityLoading = true;
      })
      .addCase(patchBookmarkStudentActivity.fulfilled, (state, action) => {
        state.patchBookmarkStudentActivityLoading = false;
      })
      .addCase(patchBookmarkStudentActivity.rejected, (state, action) => {
        state.patchBookmarkStudentActivityLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(getValidateActivityCLOMapping.pending, (state) => {
        state.getValidateActivityCLOMappingLoading = true;
      })
      .addCase(getValidateActivityCLOMapping.fulfilled, (state, action) => {
        state.getValidateActivityCLOMappingLoading = false;
      })
      .addCase(getValidateActivityCLOMapping.rejected, (state, action) => {
        state.getValidateActivityCLOMappingLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });
  },
});

export const teacherActivitySliceAction = teacherActivitySlice.actions;
