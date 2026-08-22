import type {
  AllClassworkDetailResp,
  StudentDetail,
} from "@deep-portfolio/api-types";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { GENERIC_ERROR_MESSAGE } from "../../../../utils/api-error";
import {
  fetchAllClasswork,
  fetchPortfolioPersonal,
  fetchStudentDetail,
} from "./home-action";
import type { PortfolioPersonalDetail } from "@deep-portfolio/api-types";

type HomeSlice = {
  selectedMenu: string;
  selectedSubMenu: string;
  isShowSubmenu: boolean;

  studentId: string;
  semester: string;
  academicYear: string;

  selectedCourseId?: string;

  allClasswork: AllClassworkDetailResp | null;
  studentDetail: StudentDetail | null;
  portfolioPersonal: PortfolioPersonalDetail | null;

  fetchAllClassworkLoading: boolean;
  fetchStudentDetailLoading: boolean;
  fetchPortfolioPersonalLoading: boolean;

  error: string | null;
};

const initialState: HomeSlice = {
  selectedMenu: "HOME",
  selectedSubMenu: "CLASSWORK",
  isShowSubmenu: false,

  studentId: "",
  semester: "2",
  academicYear: "2568",

  selectedCourseId: undefined,

  allClasswork: { late: [], this_week: [], upcoming: [], submitted: [] },
  studentDetail: null,
  portfolioPersonal: null,

  fetchAllClassworkLoading: false,
  fetchStudentDetailLoading: false,
  fetchPortfolioPersonalLoading: false,

  error: null,
};

export const homeSlice = createSlice({
  name: "home",
  initialState,
  reducers: {
    setSelectedMenu(state, action: PayloadAction<string>) {
      state.selectedMenu = action.payload;
    },
    setSelectedSubMenu(state, action: PayloadAction<string>) {
      state.selectedSubMenu = action.payload;
    },
    setIsShowSubMenu(state, action: PayloadAction<boolean>) {
      state.isShowSubmenu = action.payload;
    },
    setSelectedCourseId(state, action: PayloadAction<string>) {
      state.selectedCourseId = action.payload;
    },
    setStudentId(state, action: PayloadAction<string>) {
      state.studentId = action.payload;
    },
    setPortfolioPersonal(
      state,
      action: PayloadAction<PortfolioPersonalDetail | null>,
    ) {
      state.portfolioPersonal = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchAllClasswork.pending, (state) => {
        state.fetchAllClassworkLoading = true;
      })
      .addCase(fetchAllClasswork.fulfilled, (state, action) => {
        state.fetchAllClassworkLoading = false;
        state.allClasswork = action.payload.data;
      })
      .addCase(fetchAllClasswork.rejected, (state, action) => {
        state.fetchAllClassworkLoading = false;
        state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
      });

    builder
      .addCase(fetchStudentDetail.pending, (state) => {
        state.fetchStudentDetailLoading = true;
      })
      .addCase(fetchStudentDetail.fulfilled, (state, action) => {
        state.fetchStudentDetailLoading = false;
        state.studentDetail = action.payload.data;
        state.studentId = action.payload.data.student_id;
      })
      .addCase(fetchStudentDetail.rejected, (state, action) => {
        state.fetchStudentDetailLoading = false;
        state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
      });

    builder
      .addCase(fetchPortfolioPersonal.pending, (state) => {
        state.fetchPortfolioPersonalLoading = true;
      })
      .addCase(fetchPortfolioPersonal.fulfilled, (state, action) => {
        state.fetchPortfolioPersonalLoading = false;
        state.portfolioPersonal = action.payload.data;
      })
      .addCase(fetchPortfolioPersonal.rejected, (state, action) => {
        state.fetchPortfolioPersonalLoading = false;
        state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
      });
  },
});

export const homeSliceAction = homeSlice.actions;
