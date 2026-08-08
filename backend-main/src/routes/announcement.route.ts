import { Router } from "express";
import AnnouncementController from "../controllers/announcement.controller";
import upload from "../middlewares/upload-minio";

const announcementRouter = Router();
const announcementController = new AnnouncementController();

announcementRouter.get(
  "/",
  announcementController.getAnnouncements.bind(announcementController)
);

announcementRouter.post(
  "/",
  upload.array("files"),
  announcementController.createAnnouncement.bind(announcementController)
);

// announcementRouter.post(
//   "/:id/upload/file",
//   upload.single("file"),
//   announcementController.uploadFile.bind(announcementController)
// );

// announcementRouter.post(
//   "/:id/upload/url",
//   announcementController.uploadURL.bind(announcementController)
// );

// announcementRouter.post(
//   "/with-attachments",
//   upload.array("files"),
//   announcementController.createAnnouncementWithAttachments.bind(
//     announcementController
//   )
// );

announcementRouter.get(
  "/:id/attachments",
  announcementController.getAllAttachments.bind(announcementController)
);
export default announcementRouter;
