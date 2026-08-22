import { createAsyncThunk } from "@reduxjs/toolkit";
import type { ResponseWrapper } from "../../../../types/global-type";
import {
  getStudentAllClassworkList,
  getStudentDetail,
} from "../services/home-service.service";
import { getPortfolioPersonal } from "../../../../services/portfolio-personal.service";
import type { PortfolioPersonalDetail } from "@deep-portfolio/api-types";
import type {
  AllClassworkDetailResp,
  GetStudentAllCLassworkListParams,
  StudentDetail,
} from "../types/home-type";

export const fetchAllClasswork = createAsyncThunk<
  ResponseWrapper<AllClassworkDetailResp>,
  GetStudentAllCLassworkListParams
>("student/all/classwork", getStudentAllClassworkList);

export const fetchStudentDetail = createAsyncThunk<
  ResponseWrapper<StudentDetail>,
  string
>("student/detail", getStudentDetail);

export const fetchPortfolioPersonal = createAsyncThunk<
  ResponseWrapper<PortfolioPersonalDetail>,
  string
>("student/portfolio/personal", getPortfolioPersonal);
