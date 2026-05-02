import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { fetchAllCourse, fetchCourseById } from "./teacher-home-action";
import type { CourseDetailBrief } from "../types/home-type";
import type { CourseDetail } from "../../../../types/course-type.type";

type TeacherHomeSlice = {
  user_id: string;
  semester: number;
  academicYear: string;

  isShowInstructionSubMenu: boolean;
  isShowAssessmentSubMenu: boolean;
  selectedSubMenu: string | null;
  activeMenu: string | null;

  fetchAllCourseLoading: boolean;
  fetchCourseByIdLoading: boolean;
  activeCourse: CourseDetailBrief[];
  archivedCourse: CourseDetailBrief[];
  selectedCourse: CourseDetail | null;

  error: string | null;
};

const initialState: TeacherHomeSlice = {
  user_id: "2771a2eb",
  semester: 2,
  academicYear: "2568",

  isShowInstructionSubMenu: false,
  isShowAssessmentSubMenu: false,
  selectedSubMenu: null,
  activeMenu: null,

  fetchAllCourseLoading: false,
  fetchCourseByIdLoading: false,
  activeCourse: [],
  archivedCourse: [],
  selectedCourse: null,

  error: null,
};

export const teacherHomeSlice = createSlice({
  name: "teacherHome",
  initialState,
  reducers: {
    setSelectedCourse(state, action: PayloadAction<CourseDetail | null>) {
      state.selectedCourse = action.payload;
    },

    setActiveMenu(state, action: PayloadAction<string | null>) {
      state.activeMenu = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchAllCourse.pending, (state) => {
        state.fetchAllCourseLoading = true;
      })
      .addCase(fetchAllCourse.fulfilled, (state, action) => {
        state.fetchAllCourseLoading = false;
        state.activeCourse = action.payload.data.active_courses;
        state.archivedCourse = action.payload.data.archived_courses;
        state.user_id = action.payload.data.teacher_id;
      })
      .addCase(fetchAllCourse.rejected, (state, action) => {
        state.fetchAllCourseLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });

    builder
      .addCase(fetchCourseById.pending, (state) => {
        state.fetchCourseByIdLoading = true;
      })
      .addCase(fetchCourseById.fulfilled, (state, action) => {
        state.fetchCourseByIdLoading = false;
        state.selectedCourse = action.payload.data;
      })
      .addCase(fetchCourseById.rejected, (state, action) => {
        state.fetchCourseByIdLoading = false;
        state.error = action.error.message ?? "Something went wrong";
      });
  },
});

export const teacherHomeSliceAction = teacherHomeSlice.actions;
