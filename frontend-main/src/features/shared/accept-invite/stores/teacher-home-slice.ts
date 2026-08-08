import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import type { CourseDetail } from "../../../../types/course-type.type";
import { postAcceptInvite, postValidateInvite } from "./teacher-home-action";

type GroupSlice = {
  postAcceptInviteLoading: boolean;
  postValidateInviteLoading: boolean;

  error: string | null;
};

const initialState: GroupSlice = {
  postAcceptInviteLoading: false,
  postValidateInviteLoading: false,

  error: null,
};

export const groupSlice = createSlice({
  name: "group",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(postAcceptInvite.pending, (state) => {
        state.postAcceptInviteLoading = true;
      })
      .addCase(postAcceptInvite.fulfilled, (state, action) => {
        state.postAcceptInviteLoading = false;
      })
      .addCase(postAcceptInvite.rejected, (state, action) => {
        state.postAcceptInviteLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(postValidateInvite.pending, (state) => {
        state.postValidateInviteLoading = true;
      })
      .addCase(postValidateInvite.fulfilled, (state, action) => {
        state.postValidateInviteLoading = false;
      })
      .addCase(postValidateInvite.rejected, (state, action) => {
        state.postValidateInviteLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });
  },
});

export const groupSliceAction = groupSlice.actions;
