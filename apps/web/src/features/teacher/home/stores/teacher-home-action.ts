import { createAsyncThunk } from "@reduxjs/toolkit";
import type {
  CourseDetail,
  TeacherCourseListResp,
} from "@deep-portfolio/api-types";
import type { GetAllCoursesParams } from "../types/home-type";
import { getAllCourses } from "../services/home-service.service";
import type { ResponseWrapper } from "../../../../types/global-type";
import { getCourseById } from "../../../../services/course-service.service";

export const fetchAllCourse = createAsyncThunk<
  ResponseWrapper<TeacherCourseListResp>,
  GetAllCoursesParams
>("teacher/course/list", getAllCourses);

export const fetchCourseById = createAsyncThunk<
  ResponseWrapper<CourseDetail>,
  number
>("teacher/course", getCourseById);
