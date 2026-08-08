import { createAsyncThunk } from "@reduxjs/toolkit";
import type { Options, ResponseWrapper } from "../../../../types/global-type";
import { getAllStudentInSection } from "../../../../services/student-service.service";
import type { StudentDetailResp } from "../../../../types/student-type.type";

export const fetchAllStudentInSection = createAsyncThunk<
  ResponseWrapper<StudentDetailResp[]>,
  number
>("student/list", getAllStudentInSection);
