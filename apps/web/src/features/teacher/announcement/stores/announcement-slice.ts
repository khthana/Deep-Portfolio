import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import type { AnnouncmentFormType } from "../types/announement-type";
import { fetchAllAnnouncements, postAnnouncement } from "./announcement-action";
import type { AnnouncementDetailResp } from "../../../../types/course-type.type";

type AnnouncementSlice = {
  announcementForm: AnnouncmentFormType[];
  announcements: AnnouncementDetailResp[];
  fetchAllAnnouncementsLoading: boolean;

  postAnnouncementLoading: boolean;
  postURLLoading: boolean;
  postFileLoading: boolean;

  error: string | null;
};

const initialState: AnnouncementSlice = {
  announcementForm: [],
  announcements: [],
  fetchAllAnnouncementsLoading: false,

  postAnnouncementLoading: false,
  postURLLoading: false,
  postFileLoading: false,

  error: null,
};

export const teacherAnnouncementSlice = createSlice({
  name: "teacherAnnouncement",
  initialState,
  reducers: {
    setAnnouncement(state, action: PayloadAction<AnnouncmentFormType[]>) {
      state.announcementForm = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchAllAnnouncements.pending, (state) => {
        state.fetchAllAnnouncementsLoading = true;
      })
      .addCase(fetchAllAnnouncements.fulfilled, (state, action) => {
        state.fetchAllAnnouncementsLoading = false;
        state.announcements = action.payload.data;
      })
      .addCase(fetchAllAnnouncements.rejected, (state, action) => {
        state.fetchAllAnnouncementsLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(postAnnouncement.pending, (state) => {
        state.postAnnouncementLoading = true;
      })
      .addCase(postAnnouncement.fulfilled, (state, action) => {
        state.postAnnouncementLoading = false;
      })
      .addCase(postAnnouncement.rejected, (state, action) => {
        state.postAnnouncementLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });
  },
});

export const teacherAnnouncementSliceAction = teacherAnnouncementSlice.actions;
