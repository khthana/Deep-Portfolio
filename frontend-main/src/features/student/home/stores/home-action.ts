import { createAsyncThunk } from "@reduxjs/toolkit";
import type { ResponseWrapper } from "../../../../types/global-type";
import {
  getStudentAllClassworkList,
  getStudentDetail,
} from "../services/home-service.service";
import { getPortfolioPersonal } from "../../../../services/portfolio-personal.service";
import type {
  AllClassworkDetailResp,
  GetStudentAllCLassworkListParams,
  StudentDetail,
} from "../types/home-type";
import type { PortfolioPersonalResp } from "../../../../types/portfolio-personal-type.type";

export const fetchAllClasswork = createAsyncThunk<
  ResponseWrapper<AllClassworkDetailResp>,
  GetStudentAllCLassworkListParams
>("student/all/classwork", getStudentAllClassworkList);

export const fetchStudentDetail = createAsyncThunk<
  ResponseWrapper<StudentDetail>,
  string
>("student/detail", getStudentDetail);

export const fetchPortfolioPersonal = createAsyncThunk<
  ResponseWrapper<PortfolioPersonalResp>,
  string
>("student/portfolio/personal", getPortfolioPersonal);
