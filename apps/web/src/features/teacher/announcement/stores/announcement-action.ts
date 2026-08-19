import { createAsyncThunk } from "@reduxjs/toolkit";
import type { ResponseWrapper } from "../../../../types/global-type";
import { createAnnouncement } from "../services/announcement-service.service";
import type {
  AnnouncementDetailResp,
  AnnouncementIdResp,
} from "@deep-portfolio/api-types";
import { getAllAnnouncements } from "../../../../services/announcement-service.service";

export const fetchAllAnnouncements = createAsyncThunk<
  ResponseWrapper<AnnouncementDetailResp[]>,
  number
>("announcement", getAllAnnouncements);

export const postAnnouncement = createAsyncThunk<
  ResponseWrapper<AnnouncementIdResp>,
  FormData
>("announcement/create", createAnnouncement);
