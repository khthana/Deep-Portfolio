import { createAsyncThunk } from "@reduxjs/toolkit";
import type { ResponseWrapper } from "../../../../types/global-type";
import { getAllStudentInSection } from "../../../../services/student-service.service";
import type { StudentRosterEntry } from "@deep-portfolio/api-types";

export const fetchAllStudentInSection = createAsyncThunk<
  ResponseWrapper<StudentRosterEntry[]>,
  number
>("student/list", getAllStudentInSection);
