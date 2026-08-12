import { createSlice } from "@reduxjs/toolkit";
import { GENERIC_ERROR_MESSAGE } from "../../../../utils/api-error";
import { fetchAllStudentInSection } from "./teacher-student-action";

type TeacherStudentSlice = {
  fetchAllStudentInSectionLoading: boolean;

  error: string | null;
};

const initialState: TeacherStudentSlice = {
  fetchAllStudentInSectionLoading: false,

  error: null,
};

export const teacherStudentSlice = createSlice({
  name: "teacherStudent",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchAllStudentInSection.pending, (state) => {
        state.fetchAllStudentInSectionLoading = true;
      })
      .addCase(fetchAllStudentInSection.fulfilled, (state, action) => {
        state.fetchAllStudentInSectionLoading = false;
      })
      .addCase(fetchAllStudentInSection.rejected, (state, action) => {
        state.fetchAllStudentInSectionLoading = false;
        state.error = action.error.message ?? GENERIC_ERROR_MESSAGE;
      });
  },
});

export const teacherStudentSliceAction = teacherStudentSlice.actions;
