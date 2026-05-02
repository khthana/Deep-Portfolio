import { createAsyncThunk } from "@reduxjs/toolkit";
import type {
  CourseDetailBrief,
  GetAllCoursesParams,
  GetCourseDetailParams,
  TeacherCourseListResp,
} from "../types/home-type";
import { getAllCourses } from "../services/home-service.service";
import type { ResponseWrapper } from "../../../../types/global-type";
import { getCourseById } from "../../../../services/course-service.service";
import type { CourseDetail } from "../../../../types/course-type.type";

export const fetchAllCourse = createAsyncThunk<
  ResponseWrapper<TeacherCourseListResp>,
  GetAllCoursesParams
>("teacher/course/list", getAllCourses);

export const fetchCourseById = createAsyncThunk<
  ResponseWrapper<CourseDetail>,
  number
>("teacher/course", getCourseById);
