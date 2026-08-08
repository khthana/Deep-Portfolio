import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { fetchAllClasswork, fetchPortfolioPersonal, fetchStudentDetail } from "./home-action";
import type { AllClassworkDetailResp, StudentDetail } from "../types/home-type";
import type { PortfolioPersonalResp } from "../../../../types/portfolio-personal-type.type";

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
  portfolioPersonal: PortfolioPersonalResp | null;

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
    setPortfolioPersonal(state, action: PayloadAction<PortfolioPersonalResp | null>) {
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
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(fetchStudentDetail.pending, (state) => {
        state.fetchStudentDetailLoading = true;
      })
      .addCase(fetchStudentDetail.fulfilled, (state, action) => {
        state.fetchStudentDetailLoading = false;
        state.studentDetail = action.payload.data;
        state.studentId = action.payload.data.student_id;
        console.log("student id : ", action.payload.data.student_id);
      })
      .addCase(fetchStudentDetail.rejected, (state, action) => {
        state.fetchStudentDetailLoading = false;
        state.error = action.error.message ?? "Something went wrong";
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
        state.error = action.error.message ?? "Something went wrong";
      });
  },
});

export const homeSliceAction = homeSlice.actions;
