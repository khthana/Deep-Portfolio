import { Router } from "express";
import AnnouncementController from "../controllers/announcement.controller";
import { requireRole } from "../middlewares/auth.middleware";
import upload from "../middlewares/upload-minio";

const announcementRouter = Router();
const announcementController = new AnnouncementController();

announcementRouter.get(
  "/",
  announcementController.getAnnouncements.bind(announcementController),
);

// requireRole before upload: multer writes the request body into memory and
// this route's handler then puts every file in the bucket, so letting the
// upload run first would mean an unauthenticated caller could fill the bucket
// and still be told 401.
announcementRouter.post(
  "/",
  requireRole("TEACHER"),
  upload.array("files"),
  announcementController.createAnnouncement.bind(announcementController),
);

announcementRouter.get(
  "/:id/attachments",
  announcementController.getAllAttachments.bind(announcementController),
);
export default announcementRouter;
