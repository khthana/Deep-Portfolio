import { Router } from "express";
import AnnouncementController from "../controllers/announcement.controller";
import { requireRole } from "../middlewares/auth.middleware";
import { requireOwnSection } from "../middlewares/owner.middleware";
import upload from "../middlewares/upload-minio";
import { validate } from "../validation/validate";
import {
  announcementAttachmentsParams,
  announcementQuery,
  createAnnouncementBody,
} from "../validation/announcement.schema";

const announcementRouter = Router();
const announcementController = new AnnouncementController();

announcementRouter.get(
  "/",
  validate({ query: announcementQuery }),
  announcementController.getAnnouncements.bind(announcementController),
);

// requireRole before upload: multer writes the request body into memory and
// this route's handler then puts every file in the bucket, so letting the
// upload run first would mean an unauthenticated caller could fill the bucket
// and still be told 401.
// validate after upload, not before it: the body of a multipart request does
// not exist until multer has parsed it — and requireOwnSection after validate,
// because it reads a field the schema has to have refused a bad version of
// first. The upload it runs behind is into memory, not into the bucket, so a
// section that is not the caller's still stores nothing.
announcementRouter.post(
  "/",
  requireRole("TEACHER"),
  upload.array("files"),
  validate({ body: createAnnouncementBody }),
  requireOwnSection("body"),
  announcementController.createAnnouncement.bind(announcementController),
);

announcementRouter.get(
  "/:id/attachments",
  validate({ params: announcementAttachmentsParams }),
  announcementController.getAllAttachments.bind(announcementController),
);
export default announcementRouter;
